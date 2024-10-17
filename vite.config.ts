import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    drop: ['console', 'debugger'], // 移除 console 和 debugger 语句
  },
  build: {
    minify: 'esbuild',
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        store: path.resolve(__dirname, 'libs/store/index.ts'),
        timer: path.resolve(__dirname, 'libs/timer/index.ts'),
      },
      output: {
        minifyInternalExports: true,
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name]/index.mjs',
      },
    },
    lib: {
      entry: '',
      formats: ['es'],
    },
  },
})
