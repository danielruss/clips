let Papa;
async function init() {
    if (typeof window === 'undefined') {
        // Node.js environment
        console.log('IO Running in Node.js');
        const {default:p} = await import('papaparse');
        Papa=p;
    } else {
        // Browser environment
        console.log('Running in Browser');
        Papa = await import('https://cdn.jsdelivr.net/npm/papaparse@5.5.2/+esm');
    }
}
await init();


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