import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      /**
       * PWA Configuration:
       * After building and deploying the app (e.g. via Firebase Hosting or similar),
       * visiting the deployed URL in Chrome or Edge will show an install icon in the
       * address bar. On Windows, this installs the app as a standalone window accessible
       * directly from the Start menu — no separate desktop packaging step needed.
       */
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'icons/icon-192.png',
          'icons/icon-512.png',
        ],
        manifest: {
          id: '/',
          name: 'DoN — Diary of a Nerd',
          short_name: 'DoN',
          description: 'A study organizer for university students to manage units, lecture notes, timetable schedules, and academic progress.',
          // Matches the app's dark theme background color (--app-bg / --slate-950: #020617 in index.css)
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            // Real PNG icon files based on the app's book emblem logo are placed at public/icons/
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          // Exclude dynamic backend API calls (Gemini), Firebase/Firestore, and Supabase auth from service worker caching
          // These require live network connectivity and should fail gracefully with the app's existing error handling
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\/.*/,
            /^https?:\/\/(?:firestore|identitytoolkit|securetoken)\.googleapis\.com/,
            /^https?:\/\/.*supabase\.co/,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-assets-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
