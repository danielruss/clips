import {embedData,init as pipelineInit} from './embed.mjs'
import { cacheCrosswalk, crosswalk } from './crosswalk.mjs';
import { device,getOnnxRuntime } from './env.js';

let pipelineData = {
    "0.0.2": {
        model: "Xenova/GIST-small-Embedding-v0",
        model_url: "./clips_v0.0.2.onnx",
        config: {
            dtype: "fp32",
            device: device,
        },
        embeddingConfig: {
            pooling: "cls"
        }
    }
}


let current_config=null;
export async function configureClips(version="0.0.2"){
    current_config = pipelineData['0.0.2'];
    console.log(`configure_clips: ${JSON.stringify(current_config)}`)
    await pipelineInit(current_config)
    await cacheCrosswalk("naics2022")
}




// the data is a json array where each line 
// has {products_services:"",sic1987:""} There can be unused keys.
export async function runClipsPipeline(data){
    if (!data) throw new Error("No data to classify");
    // Step 1. check the data
    data = cleanData(data)
    console.log(JSON.stringify(data,null,3))
    // Step 2. Feature Extraction:
    let embeded_ps = await embedData(data)

    let ort = await getOnnxRuntime();
    const embedding_tensor = new ort.Tensor('float32',embeded_ps.data, embeded_ps.dims);

    // Step 3. Handle the crosswalking (naics2022 has 689 5-digit codes.)
    let crosswalk_input = crosswalk(data,"naics2022",689);
    const crosswalk_tensor = new ort.Tensor('float32',crosswalk_input.data, crosswalk_input.dims);

    // Step 4. load the onnx model
    let current_model = current_config.model_url;
    const session= await ort.InferenceSession.create(current_model,{executionProviders: [device] })
    const feeds = {
        embedded_input: embedding_tensor,
        crosswalked_inp: crosswalk_tensor
    }
    // Step 5. run the onnx model
    let results = await session.run(feeds);
    // Step 6. process the results.
    results = onnxResultToArray(results.naics2022_out)

    console.log(results)
    return data
}

function cleanData(data){
    if (!Array.isArray(data)) data=[data];
    let npad=  Math.floor(Math.log10(data.length));

    return data.map( (job,indx) => {
        // make sure the job has an id...
        job.Id=job.Id??`clips-res${Number(indx+1).toString().padStart(npad,"0")}`
        // convert to lower case
        job.products_services=job.products_services.toLowerCase()

        return job
    })
}

function onnxResultToArray(tensor) {
    console.log(tensor)
    const [rows, cols] = tensor.dims;
    const data = Array.from(tensor.cpuData);

    return Array.from({ length: rows }, (_, i) => data.slice(i * cols, i * cols + cols));
}