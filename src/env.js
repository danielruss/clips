const IS_BROWSER_ENV = typeof window !== "undefined" && typeof window.document !== "undefined";
const IS_WEBWORKER_ENV = typeof self !== "undefined"  && self.constructor?.name === 'DedicatedWorkerGlobalScope';
const IS_WEB_CACHE_AVAILABLE = typeof self !== "undefined" && 'caches' in self;
const IS_WEBGPU_AVAILABLE = typeof navigator !== 'undefined' && 'gpu' in navigator;
const IS_WEBNN_AVAILABLE = typeof navigator !== 'undefined' && 'ml' in navigator;
 
const IS_PROCESS_AVAILABLE = typeof process !== 'undefined';
const IS_NODE_ENV = IS_PROCESS_AVAILABLE && process?.release?.name === 'node';

export const device = IS_NODE_ENV ? "cpu":(IS_WEBGPU_AVAILABLE?"webgpu":"wasm");

export const ort = IS_NODE_ENV ? await import('onnxruntime-node') : await import('onnxruntime-web')

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/'