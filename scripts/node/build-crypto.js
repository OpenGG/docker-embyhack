import { build } from 'esbuild';
import { es5Plugin } from 'esbuild-plugin-es5';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module'; // 👈 Import createRequire

// 👇 Create a require function that's safe to use in an ES module
const require = createRequire(import.meta.url);

const bannerJS = fs.readFileSync('./crypto/original-crypto.js', 'utf-8');

await build({
  entryPoints: ['./crypto/patch/patch-crypto.ts'],
  bundle: true,
  outfile: './dist/crypto.js',
  format: 'iife',
  banner: {
    js: bannerJS,
  },
  plugins: [
    es5Plugin(),
  ],
  // 1. Tell esbuild to output ES5
  target: ['es5'],
  // 2. Provide the path to swc's helpers
  alias: {
    '@swc/helpers': path.dirname(require.resolve('@swc/helpers/package.json')),
  },
});