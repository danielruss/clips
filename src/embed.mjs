let embedder;
let embeddingConfig;

export async function init(pipelineData){
    console.log("... starting initialization embed.mjs")
    const { pipeline } = await import("@huggingface/transformers")
    embedder = await pipeline("feature-extraction",pipelineData.model,pipelineData.config)
    embeddingConfig = pipelineData.embeddingConfig;
    console.log("... initialization complete embed.mjs")
}


export async function embed_text(text) {
    if (!embedder){
        throw new Error("Embedder not set appropriately")
    }
    if (!embeddingConfig.pooling){
        throw new Error("pooling not set")
    }

    // return the embeddings...
    console.log(embeddingConfig,text)
    return await embedder(text,embeddingConfig)
}

export async function embedData(textArray){
    if (!Array.isArray(textArray)) {
        throw new Error(`In embedData: expect an array of text to embed.`)
    }
    let emb = await embed_text(textArray)
    return emb
}