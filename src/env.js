const IS_BROWSER_ENV = typeof window !== "undefined" && typeof window.document !== "undefined";
const IS_WEBWORKER_ENV = typeof self !== "undefined"  && self.constructor?.name === 'DedicatedWorkerGlobalScope';
const IS_WEB_CACHE_AVAILABLE = typeof self !== "undefined" && 'caches' in self;
const IS_WEBGPU_AVAILABLE = typeof navigator !== 'undefined' && 'gpu' in navigator;
const IS_WEBNN_AVAILABLE = typeof navigator !== 'undefined' && 'ml' in navigator;
 
const IS_PROCESS_AVAILABLE = typeof process !== 'undefined';
const IS_NODE_ENV = IS_PROCESS_AVAILABLE && process?.release?.name === 'node';

export const device = IS_NODE_ENV?"cpu":(IS_WEBGPU_AVAILABLE?"webgpu":"wasm");
export async function getOnnxRuntime(){
    let ort;
    if (IS_NODE_ENV) {
        ort = await import('onnxruntime-node')
    } else {
        ort =  await import('onnxruntime-web')
    }

    return ort;
}

/*
ort.env.wasm.wasmPaths = {
    'ort-wasm-simd-threaded.jsep.wasm': './dist/browser/ort-wasm-simd-threaded.jsep.wasm',
    'ort-wasm-simd.wasm': './dist/browser/ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': './dist/browser/ort-wasm-threaded.wasm',
}
console.log("set wasm path ====>",ort.env.wasm.wasmPaths)
*/