import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    base: '/myysynth/',
    sourcemap: true, // Generate source maps for debugging
    minify: 'terser', // Use Terser for minification
  },
});
