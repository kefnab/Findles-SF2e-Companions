import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  publicDir: 'static',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'findles-sf2e-companions',
      formats: ['es'],
      fileName: () => 'index.js'
    }
  }
});