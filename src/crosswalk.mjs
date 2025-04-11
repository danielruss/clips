const knownCrosswalks = new Map([
    ["soc2010", new Map([
        ["soc1980", "https://danielruss.github.io/codingsystems/soc1980_soc2010.json"],
        ["noc2011", "https://danielruss.github.io/codingsystems/noc2011_soc2010_via_soc2018.json"],
        ["isco1988", "https://danielruss.github.io/codingsystems/isco1988_soc2010.json"]
    ])],
    ["naics2022", new Map([
        ["sic1987", "https://danielruss.github.io/codingsystems/sic1987_naics2022_5d.json"]
    ])]
])

const cachedCrosswalk = new Map()
const codingSystemInfo = new Map()

export async function cacheCrosswalk(toCodingSystem){
    // get all coding system to soc2010 or naic2022
    let map = knownCrosswalks.get(toCodingSystem);
    if (!map) return;



    // get - or create - a map of all the codingsystems
    // that already have a crosswalk to "toCodingSystem"
    if (!cachedCrosswalk.has(toCodingSystem)){
        cachedCrosswalk.set(toCodingSystem,new Map())
    }
    let currentCrosswalks=cachedCrosswalk.get(toCodingSystem)

    // for each knownCrosswalk, cache it in the currentCrosswalk map...
    let promises = map.entries().map( async ([fromCodingSystem,url]) => {
        let xw=await buildCrossWalk(url,fromCodingSystem,toCodingSystem);
        console.log(`cacheing crosswalk ${fromCodingSystem} => ${toCodingSystem}`)
        currentCrosswalks.set(fromCodingSystem,xw)
    })
    await Promise.all(promises);
    console.log("... finished caching crosswalks ...")
}
function availableCrosswalks(toCodingSystem){
    if (!knownCrosswalks.has(toCodingSystem)){
        return []
    }
    return Array.from(knownCrosswalks.get(toCodingSystem).keys())
}

async function buildCrossWalk(url, fromSystem, toSystem) {
    const raw = await (await fetch(url)).json()
    let toCodes = raw.reduce( (acc,current) => {
        acc.add(current[toSystem]);
        return acc
    },new Set());
    toCodes = Array.from(toCodes).sort()
    

    toCodes = toCodes.reduce((acc,currentValue,currentIndex)=>{
        acc.set(currentValue,{index:currentIndex,code:currentValue});
        return acc
    },new Map());

    // if we have not already added the cs info, do so now...
    if (!codingSystemInfo.has(toSystem)){
        codingSystemInfo.set(toSystem,{fromCodingSystems:[],number_of_codes:toCodes.size})
    }
    let currentCodingSystemInfo = codingSystemInfo.get(toSystem)
    currentCodingSystemInfo.fromCodingSystems.push(fromSystem);
    if (currentCodingSystemInfo.number_of_codes != toCodes.size) {
        throw new Error(`The crosswalks have different number of codes. Expected: ${currentCodingSystemInfo.number_of_codes} Received (${fromSystem}=>${toSystem}): ${toCodes.length}`)
    }
    
    const xw = raw.reduce((acc, current) => {
        if (!acc.has(current[fromSystem])) {
          acc.set(current[fromSystem], [])
        }
        acc.get(current[fromSystem]).push(toCodes.get(current[toSystem]))
        return acc;
    }, new Map())

     return xw
}


export function crosswalk(data,toCodingSystem,ncodes){
    if (!Array.isArray(data)) {throw new Exception("data must be an array to crosswalk")}
    if (data.length==0) {throw new Exception("empty data passed to crosswalk")};

    // build the return buffer...
    const calcIndex = (row, col) => row * ncodes + col
    let buffer = {
        data: new Float32Array(data.length * ncodes),
        dims: [data.length, ncodes]
    }

    // get the crosswalks, and all columns that must be crosswalked
    let xwalks = cachedCrosswalk.get(toCodingSystem)
    let crosswalkableColumns = Object.keys(data[0]).filter( k => xwalks.has(k))

    // for each column, crosswalk all jobs...
    crosswalkableColumns.forEach( fromCS =>{
        let xw = xwalks.get(fromCS);
        data.forEach((datarow,rowIndex) => {
            console.log(`${fromCS}: ${datarow[fromCS]} -> ${toCodingSystem}: ${xw.get(datarow[fromCS])?.map(x=>x.index)??[]}`);
            let indices = xw.get(datarow[fromCS])?.map(x=>x.index)??[]
            let buffer_indices = indices.map((i)=> calcIndex(rowIndex,i))
            console.log(buffer_indices);
            indices.forEach((i)=> buffer.data[calcIndex(rowIndex,i)]=1)
        })
    });

    return buffer
}