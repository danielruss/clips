import * as Papa from 'papaparse'


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