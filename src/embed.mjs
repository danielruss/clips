let embedder;
let embeddingConfig;

export const isNode = typeof process !== 'undefined' && 
  process?.release?.name === 'node';

export async function init(pipelineData){
    console.log("embed init:",pipelineData)
    const { pipeline, env } = await import("@huggingface/transformers")
    if (isNode){
        // we are using node. use the cache version..
        // check if the cached model exists...
        const { existsSync } = await import('fs');
        const { join } = await import('path');
        
        // Check if model exists locally first
        const modelPath = join(env.cacheDir, pipelineData.model);
        if (!existsSync(modelPath)) {
            throw new Error(`Model not cached locally: ${pipelineData.model}`);
        }
        console.log(`using embedding model ... ${modelPath}`);

        env.allowRemoteModels = false;
        env.allowLocalModels = true;
    }
    embedder = await pipeline("feature-extraction",pipelineData.model,pipelineData.pipeline_config);
    embeddingConfig = pipelineData.embedding_config;
}


export async function embed_text(text) {
    if (!embedder){
        throw new Error("Embedder not set appropriately")
    }
    if (!embeddingConfig.pooling){
        throw new Error("pooling not set")
    }

    // return the embeddings...
    return await embedder(text,embeddingConfig)
}

export async function embedData(textArray){
    if (!Array.isArray(textArray)) {
        throw new Error(`In embedData: expect an array of text to embed.`)
    }
    let emb = await embed_text(textArray)
    return emb
}