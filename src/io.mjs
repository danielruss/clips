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
    let aoo = results.map( (job) => {
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
    return {header,aoo};
}

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
    console.log(workbook.Custprops,"\n",workbook)

    // download the file..
    XLSX.writeFile(workbook,filename)
}

export async function download_csv(results,{filename="clips.csv"}={}){
    if (results.length == 0) return

    // widen the data instead of arrays
    let {header,aoo} = getArrayOfObjects(results)

    // 
    let papa_obj = {
        fields:header,
        data:aoo
    }

    let txt=Papa.unparse(papa_obj)
    download(new Blob([txt],{type:"text/csv;charset=utf-8"}),filename)   
}

function download(blob,filename){
    // download... 
    var a = document.createElement("a");
    a.style = "display: none";
    document.body.appendChild(a);
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.filename = filename;
    a.click();
    URL.revokeObjectURL(url);
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