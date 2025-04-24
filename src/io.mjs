import * as Papa from 'papaparse'
import * as XLSX from 'xlsx/xlsx.mjs';

function getArrayOfObjects(results){
    if (results.length == 0) return
    let header = results.input_fields.slice()
    let k=results[0].naics2022.length;
    for (let indx=0;indx<k;indx++){
        header.push(`naics2022_${indx+1}`,`title_${indx+1}`,`score_${indx+1}`)
    }

    // convert arrays to naics2022_1..naics2022_n, title_1..title_n, score_1..score_n
    // for each job ...
    let data = results.map( (job) => {
        // add all the inputs
        let wide_job = results.input_fields.reduce( (acc,cv)=>{
            acc[cv]=job[cv]
            return acc
        },{} )
        // all all n of the results...
        job.naics2022.forEach( (code,indx) => {
            wide_job[`naics2022_${indx+1}`]=code
            wide_job[`title_${indx+1}`]=job.title[indx]
            wide_job[`score_${indx+1}`]=job.score[indx]
        })
        return wide_job
    })

    let blockId=results.blockId??0
    return {header,data,blockId};
}

export async function read_excel(file,{sheet=0}={}){
    const workbook=XLSX.read(file)
    const sheetname = workbook.SheetNames[sheet]
    const worksheet = workbook.Sheets[sheetname]
    const aoo = XLSX.utils.sheet_to_json(worksheet)
    let fields = [];
    if (aoo.length>0) {
        fields = Object.keys(aoo[0])
    }
    return {data:aoo,meta:{fields}}
}

export async function read_csv(file){
    return new Promise( (resolve,reject)=> 
        Papa.parse(file,{
            header: true,
            skipEmptyLines:true,
            complete: function(results){
                resolve(results)
            }
        })
    )
}


/*  
 Read/Write data in blocks.

 Note: excel does not read data in block.  
 What we do is read ALL the data and return
 blocks.
*/
export async function getFileIterator(file,config={}){
    switch (file.type){
        case "text/csv":
            return csvFileIterator(file,config)
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            return excelFileIterator(file,config)
    }
}

async function excelFileIterator(file,{linesPerBlock=40}={}) {
    linesPerBlock=linesPerBlock??40;

    let fileReader = new FileReader()
    let arrayBuffer = await readAsArrayBuffer(file)
    let workbook = XLSX.read(arrayBuffer);

    const sheetname = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetname]
    let iterator = excelBlockGenerator(worksheet)
    return iterator
}

function readAsArrayBuffer(file){
    return new Promise( (resolve,reject) =>{
        const reader = new FileReader();
        reader.onload = ( (event)=>resolve(event.target.result) );
        reader.onerror = ( (event)=>reject(event.target.error) );
        reader.readAsArrayBuffer(file)
    })
}

function *excelBlockGenerator(worksheet,linesPerBlock=100){
    const aoo = XLSX.utils.sheet_to_json(worksheet)
    if (aoo.length==0) return

    const fields = Object.keys(aoo[0])
    yield {
        totalBlocks: Math.ceil(aoo.length/linesPerBlock),
        totalLines: aoo.length
    }
    let lines=0
    let blockId=0

    while(lines<aoo.length){
        let l0=lines;
        lines=Math.min(lines+linesPerBlock,aoo.length)
        yield {
            data: aoo.slice(l0,lines),
            meta: { 
                blockId,
                fields,
                lines
            }
        }
        blockId++;
    }
}


// CSV INPUT ...
async function csvFileIterator(file,{chunkSize=5*1024}={}) {
    let {lines,blocks} = await csvCountLines(file)
    let iterator = csvGenerator(file,blocks,lines,{maxQueueSize:10,chunkSize})

    return iterator
}

async function csvCountLines(file) {
    let MB=1024
    let lines=0
    let blocks=0
     return new Promise((resolve, reject) =>
        Papa.parse(file,{
            header: true,
            skipEmptyLines: true,
            chunkSize:5*MB,
            chunk: function (results, parser) {
                lines += results.data.length
                blocks +=1
            },
            complete: function(results,file){
                resolve({lines,blocks})
            }
        })
    )
}

// Papa Parse requires a callback.  The generator returned has a queue of chunks that
// reads ahead in the filew
function csvGenerator(file, totalBlocks, totalLines, {maxQueueSize=10,chunkSize=5*1024}={}) {
    const queue = [];
    let resolvePromise;
    let parserInstance;
    let isParsingPaused=false
    let blocks=0;
    let lines=0;

    async function* generator() {
        yield {totalBlocks,totalLines}
        while (true) {
            if (queue.length > 0) {
                let block =queue.shift()

                if (block === null) return;
                yield block // Yield the next block

                // Resume the parser if queue size drops below the threshold
                if (queue.length < maxQueueSize && parserInstance) {
                    if (isParsingPaused){
                        isParsingPaused=false;
                    }
                    parserInstance.resume();                            
                }
            } else {
                // Wait for a row to be added to the queue
                await new Promise((resolve) => (resolvePromise = resolve));
            }
        }
    }

    // Parse the CSV data
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunkSize:chunkSize,

        chunk: function (results, parser) { 
            results.meta.blockId=blocks;
            results.meta.lines = lines;
            queue.push(results); // Add results to the queue
            if (blocks==0){
                parserInstance = parser; // Save parser instance
            }
            blocks++
            lines += results.data.length

            // Pause parser if queue size exceeds the maximum
            if (queue.length >= maxQueueSize) {
                parser.pause();
                isParsingPaused=true;
            }

            // Signal the generator to continue
            if (resolvePromise) {
                resolvePromise();
                resolvePromise = null;
            }
        },
        complete: function () {
            queue.push(null)
        }
    });

    return generator();
}





// If you read the entire file and run in one block... use download_XXX
// this avoid the use of OPFS
export async function download_excel(results,{filename="clips.xlsx"}={}){
    if (results.length == 0) return

    // widen the data instead of arrays
    let {header,aoo} = getArrayOfObjects(results)

    // create an excel workbook
    let workbook = XLSX.utils.book_new();
    let sheet = XLSX.utils.json_to_sheet(aoo,{header})
    XLSX.utils.book_append_sheet(workbook,sheet,'clips results')

    if (!workbook.Custprops) workbook.Custprops = {};
    Object.entries(results.metadata).forEach( ([k,v])=> workbook.Custprops[k]=v)

    // download the file..
    XLSX.writeFile(workbook,filename)
}

export async function download_csv(results,{filename="clips.csv"}={}){
    if (results.length == 0) return

    // widen the data instead of arrays
    let {header,aoo} = getArrayOfObjects(results)

    let papa_obj = {
        fields:header,
        data:aoo
    }

    let txt=Papa.unparse(papa_obj)
    download(new Blob([txt],{type:"text/csv;charset=utf-8"}),filename)   
}

// If you need to run in blocks.. write the blocks to OPFS.
// You'll need to:
//  1. create a stream
//  2. write the blocks
//  3. close the stream
//  4. download the results...
// as CSV or JSONL  and downloadResultsFromOPFS...
export async function createOPFSWritableStream(filename){
    // the OPFS file is a csv/jsonl
    const opfsRoot = await navigator.storage.getDirectory();
    let fileHandle = await opfsRoot.getFileHandle(filename, { create: true });
    return await fileHandle.createWritable()
}

export async function writeResultsBlockToOPFS(block,writableStream,encoder,format){
    let aoo = getArrayOfObjects(block)
    switch(format) {
        case "JSONL":
            writeJSONResultBlockToOPFS(aoo,writableStream,encoder)
            break;
        default:
            // CSV or Excel write need to be in csv format.
            // because you cannot write excel as in blocks.
            writeCSVResultBlockToOPFS(aoo,writableStream,encoder)
    }
}

async function writeJSONResultBlockToOPFS(arrayOfObjects, writableStream, encoder) {
    let txt_block = arrayOfObjects.data
        .map((line) => JSON.stringify(line))
        .join("\n") + "\n"
    await writableStream.write(encoder.encode(txt_block))
    return
}

async function writeCSVResultBlockToOPFS(arrayOfObjects,writableStream,encoder){
    const csv = Papa.unparse({
        data:arrayOfObjects.data,
        fields:arrayOfObjects.header,
    },{
        header:arrayOfObjects.blockId==0,
        newline: "\n"
    })+"\n"
    const utf8 = encoder.encode(csv)
    await writableStream.write(utf8)
}

export async function closeOPFSStream(writableStream){
    await writableStream.close()
}


/// Output formats: "CSV","Excel","JSONL"
export async function downloadResultsFromOPFS(filename,outputFormat,metadata){
    switch (outputFormat){
        case "Excel": 
            // download the CSV file in OPFS as Excel...
            downloadOPFSFileAsExcel(filename,metadata)
            break;
        default:
            // CSV and JSONL are saved in the correct format just download.
            downloadOPFSFile(filename,metadata);
            break;      
    }
}

function download(blob,filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; 
    a.click();
    URL.revokeObjectURL(url);
}

async function downloadOPFSFile(filename,metadata) {
    const opfsRoot = await navigator.storage.getDirectory();
    let fileHandle = await opfsRoot.getFileHandle(filename);   
    const file = await fileHandle.getFile();
    download(file,filename)
}

async function downloadOPFSFileAsExcel(filename,metadata) {
    const opfsRoot = await navigator.storage.getDirectory();
    let fileHandle = await opfsRoot.getFileHandle(filename);
    const file = await fileHandle.getFile();

    Papa.parse(file,{
        header:true,
        skipEmptyLines:true,
        complete:function(results){
            let workbook = XLSX.utils.book_new();
            let worksheet = XLSX.utils.json_to_sheet(results.data,{header:results.meta.fields})
            XLSX.utils.book_append_sheet(workbook,worksheet,"CLIPS results");
            if (!workbook.Custprops) workbook.Custprops={};
            Object.assign(workbook.Custprops,metadata)
            XLSX.writeFile(workbook,filename)
        }
    })
}