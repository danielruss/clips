import fs from 'node:fs';

import { read_csv,configureClips,runClipsPipeline } from "./dist/node/clips.js";

await configureClips()


console.log(`======================================================`)
let fileStream = fs.createReadStream("./dev/dev_data.csv");
let dta = await read_csv(fileStream)
//console.log(`The data are ${JSON.stringify(dta.data,null,3)}\nmeta: ${JSON.stringify(dta.meta,null,3)}`)
let res = await runClipsPipeline(dta.data)
console.log(`The results are ${JSON.stringify(res,null,3)}`)

console.log(`======================================================`)

fileStream = fs.createReadStream("./dev/dev_data2.csv");
dta = await read_csv(fileStream)
//console.log(`The data are ${JSON.stringify(dta.data,null,3)}\nmeta: ${JSON.stringify(dta.meta,null,3)}`)
res = await runClipsPipeline(dta.data)
console.log(`The results are ${JSON.stringify(res,null,3)}`)