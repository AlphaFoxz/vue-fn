import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vite';

const modules = fs.readdirSync(path.join(__dirname, 'libs'));

export default defineConfig({
  build: {
    minify: 'oxc',
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['vue', '@vue/reactivity'],
      input: parseModules(),
      output: {
        minifyInternalExports: true,
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name]/index.mjs',
        minify: {
          compress: { dropConsole: true, dropDebugger: true },
          mangle: true,
          codegen: false,
        },
      },
    },
    lib: {
      entry: '',
      formats: ['es'],
    },
  },
});

function parseModules() {
  return modules.reduce((acc, name) => {
    const moduleDir = path.join(__dirname, 'libs', name);
    if (!fs.statSync(moduleDir).isDirectory()) {
      throw new Error(`libs/${moduleDir} is not a directory`);
    }
    acc[name] = path.resolve(moduleDir, 'index.ts');
    return acc;
  }, {} as Record<string, string>);
}
