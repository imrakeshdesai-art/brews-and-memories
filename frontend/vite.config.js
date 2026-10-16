import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function vercelStorageOptimizer(isVercel) {
  return {
    name: 'vercel-storage-optimizer',
    closeBundle() {
      if (isVercel) {
        const originalsDir = path.resolve(__dirname, 'dist/wallpapers/originals');
        if (fs.existsSync(originalsDir)) {
          fs.rmSync(originalsDir, { recursive: true, force: true });
          console.log('[Vercel Storage Optimizer] Excluded dist/wallpapers/originals from Vercel deployment bundle.');
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const isVercel = mode === 'vercel' || process.env.VERCEL === '1' || process.env.BUILD_TARGET === 'vercel';

  return {
    plugins: [
      react(),
      vercelStorageOptimizer(isVercel),
    ],
    server: {
      port: 4173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Disable source maps in production
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom', 'axios'],
          },
        },
      },
    },
    define: {
      'process.env': {},
    },
  };
});
