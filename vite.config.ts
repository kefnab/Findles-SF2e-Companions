import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  publicDir: 'static',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(import.meta.dirname, 'src/index.ts'),
      name: 'findles-starfinder-helper',
      formats: ['es'],
      fileName: () => 'index.js'
    }
  }
});