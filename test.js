import { pipeline,env } from "@huggingface/transformers";

let embedder = await pipeline('feature-extraction','Xenova/GIST-small-Embedding-v0',{dtype:'fp32'});

let x= await embedder(['hosptial care', "women's clothes" ])
console.log(x.data.slice(0,3))
x= await embedder(['hosptial care', "women's clothes" ],{ pooling: 'cls', normalize: true })
console.log(x.data.slice(0,3))
x=await embedder(['hosptial care', "women's clothes" ],{ pooling: 'mean', normalize: true })
console.log(x.data.slice(0,3))
x=await embedder(['hosptial care', "women's clothes" ],{ pooling: 'cls', normalize: false })
console.log(x.data.slice(0,3))
x=await embedder(['hosptial care', "women's clothes" ],{ pooling: 'mean', normalize: false })
console.log(x.data.slice(0,3))

x=await embedder([
'hosptial care', "women's clothes",'hosptial care', "women's clothes" ,'hosptial care', "women's clothes",
'hosptial care', "women's clothes",'hosptial care', "women's clothes" ,'hosptial care', "women's clothes", 
'hosptial care', "women's clothes",'hosptial care', "women's clothes" ,'hosptial care', "women's clothes", 
'hosptial care', "women's clothes",'hosptial care', "women's clothes" ,'hosptial care', "women's clothes",  
],{ pooling: 'mean', normalize: false })
console.log(x.tolist().map(x=>x.slice(0,3)))