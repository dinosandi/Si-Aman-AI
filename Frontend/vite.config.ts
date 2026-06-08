import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routeFileIgnorePattern: "components",
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true, // Enable during development to test offline capabilities
      },
      manifest: {
        name: "SI AMAN- Kab. Madiun",
        short_name: "SI AMAN",
        description:
          "Sistem Pemetaan Keamanan dan Rekomendasi Rute Aman Kabupaten Madiun",
        theme_color: "#16a34a", // Emerald/green safety color
        background_color: "#f8fafc", // slate-50
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          // 1. Spatial/Map Caching (OpenStreetMap Tiles)
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Mapbox Vector Tiles or Styles API
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "mapbox-assets",
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 15 * 24 * 60 * 60, // 15 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. Offline API Caching (SI AMAN AI endpoints)
          // We use NetworkFirst: tries to fetch latest data, falls back to local cache if user is offline or signal drops
          {
            urlPattern:
              /\/api\/v1\/(routes\/safe|reports\/crowdsource|zones\/risk)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "si-aman-api-cache",
              networkTimeoutSeconds: 5, // Fallback to cache after 5 seconds of no response
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 3. Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
