
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ustawienie base na './' jest kluczowe dla GitHub Pages, 
  // ponieważ projekty często znajdują się w podfolderach (np. /nazwa-repo/)
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Optymalizacja budowania dla środowisk produkcyjnych
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
