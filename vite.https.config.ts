import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3020,
    https: {
      // If you have certificates, use these:
      key: fs.readFileSync(path.resolve(__dirname, 'cert.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.crt')),
      
      // Otherwise, this will generate self-signed certificates automatically
    },
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
