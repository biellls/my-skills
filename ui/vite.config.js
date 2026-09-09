const { defineConfig } = require('vite');
const path = require('node:path');
module.exports = defineConfig({
  root: __dirname,
  publicDir: false,
  build: { outDir: path.resolve(__dirname, '../skills/in-progress/sketchpad/demo'), emptyOutDir: false, rollupOptions: { input: path.resolve(__dirname, 'index.html') } }
});
