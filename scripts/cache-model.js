#!/usr/bin/env node
import { pipeline, env } from "@huggingface/transformers";

async function run() {
    const model = 'Xenova/GIST-small-Embedding-v0';
    console.log(`Checking local cache for: ${model}`);

    // Set remote to true just for this download script
    env.allowRemoteModels = true;

    try {
        // This triggers the download if missing, or skips if present
        await pipeline("feature-extraction", model, {
            progress_callback: (p) => {
                if (p.status === 'progress') {
                    process.stdout.write(`\rDownloading: ${p.progress.toFixed(1)}% `);
                }
            }
        });
        console.log(`\n✅ Model is cached and ready for offline use.`);
    } catch (err) {
        console.error(`\n❌ Cache failed: ${err.message}`);
        process.exit(1);
    }
}

run();