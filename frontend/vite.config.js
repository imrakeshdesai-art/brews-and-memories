import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
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
      sourcemap: false, // Strict: disable production source maps
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-core';
              }
              if (id.includes('gsap')) {
                return 'gsap-vendor';
              }
              if (id.includes('axios')) {
                return 'network-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    define: {
      'process.env': {},
    },
  };
});
