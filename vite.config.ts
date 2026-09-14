import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      devOptions: {
        enabled: true,           // Enable PWA in dev mode so install prompt appears on localhost
        type: 'module',
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'روتين اليومي - تمارين الظهر',
        short_name: 'روتين',
        description: 'تطبيق التمارين والعلاج الطبيعي اليومي لآلام الظهر والاستمرارية',
        theme_color: '#0f172a',
        background_color: '#0b0f19',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        dir: 'rtl',
        lang: 'ar',
        categories: ['health', 'fitness'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'ابدأ تمرين اليوم',
            short_name: 'تمرين اليوم',
            description: 'بدء جلسة التمارين المجدولة لليوم مباشرة',
            url: '/?action=start-today',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },
    }),
  ],
})
