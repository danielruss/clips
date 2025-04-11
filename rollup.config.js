import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from '@rollup-extras/plugin-copy';

export default [
  {
    input: './src/clips.mjs',
    output: [{
      dir: './dist/browser',
      format: 'es', // Output as an ES module (.mjs)
      sourcemap: true, // Generate a sourcemap for debugging
    }],
    plugins: [
      nodeResolve({
        browser: true, // Resolve browser-specific modules
      }),
      commonjs(),
      terser(), // Minify the output in production mode
      copy({
        targets: [
          {
            src: 'node_modules/onnxruntime-web/dist/*.wasm',
            dest: './'
          }
        ]
      }),
    ],
  },
  {
    input: './src/clips.mjs',
    output: [{
      dir: './dist/node',
      format: 'es', // Output as an ES module (.mjs)
      sourcemap: true, // Generate a sourcemap for debugging
    }],
    plugins: [
      nodeResolve({
        browser: false, 
      }),
      commonjs({
        dynamicRequireTargets: ['../bin/napi-v3/**/*'],
        ignoreDynamicRequires: false, // Process dynamic requires
      }),
      terser(),
    ],
    external: ['@huggingface/transformers','onnxruntime-node'],
  }
];