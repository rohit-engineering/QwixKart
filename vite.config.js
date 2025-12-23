import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    base: '/',

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },

    plugins: [
      vue(),

      // compression only in prod
      isProd && compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024
      }),
      isProd && compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024
      }),

      // ✅ ALWAYS LOAD PWA PLUGIN
      VitePWA({
        registerType: 'prompt',

        // 🔑 THIS IS THE KEY
        devOptions: {
          enabled: false // ⛔ no SW in dev
        },

        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallback: '/index.html',

          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                networkTimeoutSeconds: 2
              }
            },
            {
              urlPattern: /\.(js|css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'assets-cache'
              }
            }
          ]
        }
      }),

      visualizer({
        filename: 'dist/stats.html',
        open: false
      })
    ].filter(Boolean),

    build: {
      target: 'esnext',
      minify: 'terser',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 800,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.split('node_modules/')[1].split('/')[0]
            }
          }
        }
      }
    },

    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'axios',
        'bootstrap',
        'vue-toastification',
        '@tanstack/vue-query',
        '@supabase/supabase-js',
        'sweetalert2'
      ],
      exclude: ['html2pdf.js']
    },

    server: {
  host: '0.0.0.0',
  port: 5173,
  strictPort: true,

  hmr: {
    protocol: 'ws',
    host: 'localhost',
    port: 5173
  },

  watch: {
    ignored: ['**/node_modules/**', '**/.vite/**']
  }
}
  }
})
