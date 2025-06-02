import mocha from 'https://cdn.jsdelivr.net/npm/mocha@10.7.3/+esm'
import { assert } from 'https://cdn.jsdelivr.net/npm/chai@5.1.1/+esm'
import * as clips from '../dist/browser/clips.js'


HTMLTableRowElement.prototype.insertHead = function(index = -1){
    const th = document.createElement("th");
    if (index < 0 || index >= this.children.length) {
        this.appendChild(th); // Default to appending if index is out of bounds
    } else {
        this.insertBefore(th, this.children[index]);
    }
    return th;
}

function updateTable(id,res){
    function format_score(num){
        return Math.abs(num)<1e-3?num.toExponential(1):num.toFixed(4)
    }

    let tableElement=document.getElementById(id);
    tableElement.innerText=""
    const nrows = res.length;
    if (nrows == 0) return 
    const k = res[0]['naics2022'].length;

    // build the header row...
    let tableHeaderRow=tableElement.insertRow()
    res.input_fields.forEach( (f) => {
        let cell=tableHeaderRow.insertHead();
        cell.innerText=f
    })
    for (let i=0;i<k;i++){
        let cell=tableHeaderRow.insertHead();
        cell.innerText = `naics2022_${i}`
        cell=tableHeaderRow.insertHead();
        cell.innerText = `title_${i}`
        cell=tableHeaderRow.insertHead();
        cell.innerText = `score_${i}`
    }

    // build the data table....
    for (let i=0;i<nrows;i++){
        let tableDataRow=tableElement.insertRow()
        res.input_fields.forEach( (f) => {
            let cell=tableDataRow.insertHead();
            cell.innerText = res[i][f]
        })
        for (let j=0;j<k;j++){
            let cell=tableDataRow.insertCell()
            cell.innerText = res[i]['naics2022'][j]
            cell=tableDataRow.insertCell()
            cell.innerText = res[i]['title'][j]
            cell=tableDataRow.insertCell()
            cell.innerText = format_score(res[i]['score'][j])
        }
    }
}

mocha.setup('bdd');
describe('Read XL', () => {
    it('it should read an excel file', async function(){
        let url = "../dev/dev_data.xlsx"
        let excelBlob = await (await fetch(url)).arrayBuffer() 
        let dta = await clips.read_excel(excelBlob)

        let config = await clips.configureClips()
        let xlRes = await clips.runClipsPipeline(dta,config)
        updateTable("xlTable",xlRes)
        //download_excel(xlRes)
    })
})

describe('Read csv', () => {
    it('it should read an csv file', async function(){
        let url = "../dev/dev_data.csv"
        let excelBlob = await (await fetch(url)).blob() 
        let dta = await clips.read_csv(excelBlob)

        let config = await clips.configureClips()
        let csvRes = await clips.runClipsPipeline(dta,config)

        updateTable("csvTable",csvRes)
        //clips.download_csv(csvRes)
    })
})

mocha.run();