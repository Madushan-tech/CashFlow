import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets use relative paths (essential for GitHub Pages)
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});