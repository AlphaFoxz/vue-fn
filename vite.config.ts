import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'

const modules = fs.readdirSync(path.join(__dirname, 'libs'))

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
      input: parseModules(),
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

function parseModules() {
  return modules.reduce((acc, name) => {
    const moduleDir = path.join(__dirname, 'libs', name)
    if (!fs.statSync(moduleDir).isDirectory()) {
      throw new Error(`libs/${moduleDir} is not a directory`)
    }
    acc[name] = path.resolve(moduleDir, 'index.ts')
    return acc
  }, {} as Record<string, string>)
}
