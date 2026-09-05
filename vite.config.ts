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
      manifest: {
        name: 'روتين اليومي - Daily Routine',
        short_name: 'روتين',
        description: 'تطبيق التمارين والعلاج الطبيعي اليومي لآلام الظهر والاستمرارية',
        theme_color: '#0f172a',
        background_color: '#0b0f19',
        display: 'standalone',
        orientation: 'any',
        dir: 'rtl',
        lang: 'ar',
        shortcuts: [
          {
            name: 'ابدأ تمرين اليوم',
            short_name: 'تمرين اليوم',
            description: 'بدء جلسة التمارين المجدولة لليوم مباشرة',
            url: '/?action=start-today'
          }
        ]
      }
    })
  ],
})

