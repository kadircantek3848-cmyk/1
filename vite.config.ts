import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression (daha iyi sıkıştırma)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analizi için (isteğe bağlı)
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    target: 'es2015',
    minify: 'terser', // esbuild yerine terser - daha iyi minification
    cssMinify: true,
    sourcemap: true, // Source maps üretim için (debugging)
    
    terserOptions: {
      compress: {
        drop_console: true, // console.log'ları kaldır
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Yorumları kaldır
      },
    },
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Firebase vendor chunk
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          // Router chunk
          if (id.includes('node_modules/react-router-dom')) {
            return 'router';
          }
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/react-hot-toast')) {
            return 'form-libs';
          }
          // Lucide icons - lazy load
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // PDF/Canvas libraries - lazy load
          if (id.includes('node_modules/html2canvas') || id.includes('node_modules/jspdf')) {
            return 'pdf-libs';
          }
          // Google AI
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'google-ai';
          }
          // XML parsers
          if (id.includes('node_modules/fast-xml-parser') || id.includes('node_modules/xml2js')) {
            return 'xml-parsers';
          }
        },
        // Asset dosya isimleri için hash kullan (cache busting)
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|webp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    
    chunkSizeWarningLimit: 600, // 600 KB chunk uyarısı
    assetsInlineLimit: 4096, // 4KB altındaki dosyaları inline yap
    cssCodeSplit: true,
  },
  
  server: {
    hmr: {
      overlay: false,
    },
    // Development server optimizasyonları
    fs: {
      strict: true,
    },
  },
  
  // CSS preprocessing optimizasyonları
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        // autoprefixer otomatik yüklenir
      ],
    },
  },
});
