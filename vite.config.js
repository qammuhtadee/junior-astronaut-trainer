import { defineConfig } from 'vite';

// Vercel auto-detects Vite: build command `npm run build`, output dir `dist`.
export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0, // keep pixel-art files as real files (no base64 inlining)
    chunkSizeWarningLimit: 1600, // Phaser itself is ~1.2 MB
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } }, // cache Phaser separately from game code
    },
  },
});
