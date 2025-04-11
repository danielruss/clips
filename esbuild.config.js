const esbuild = await import('esbuild');
 
// For Node
esbuild.build({
  entryPoints: ['src/clips.mjs'],
  bundle: true,
  outfile: 'dist/bundle.node.js',
  platform: 'node',
  format: 'esm',
  external: ['@huggingface/transformers','onnxruntime-node','onnxruntime-web'],
}).catch(() => process.exit(1));
 
// For browser
esbuild.build({
    entryPoints: ['src/clips.mjs'],
    bundle: true,
    outfile: 'dist/bundle.esm.js',
    platform: 'browser',
    format: 'esm',
  }).catch(() => process.exit(1));