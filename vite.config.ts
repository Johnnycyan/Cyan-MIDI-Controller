import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // Explicitly set to localhost to ensure MIDI API works
    port: 3020,
    open: true, // Automatically open browser
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
