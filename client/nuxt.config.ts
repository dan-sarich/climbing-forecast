// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // App configuration
  app: {
    head: {
      title: 'Climbing Forecast',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Predict climbing conditions based on weather forecast' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Montserrat&display=swap' },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css' }
      ]
    }
  },

  // Global CSS
  css: [
    '@/assets/css/main.css'
  ],

  // Auto import components
  components: true,

  // Modules
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  // Plugins
  plugins: [
    '~/plugins/mobile-menu.client'
  ],

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side)
    // Public keys (exposed to client)
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:5000/api',
      placesApiKey: process.env.PLACES_API || ''
    }
  },

  // TypeScript configuration
  typescript: {
    strict: true
  },

  // Development server configuration
  devServer: {
    port: 3000
  },

  // Vite configuration for HMR
  // These settings optimize Hot Module Replacement (HMR) for faster development
  // The configuration is especially tuned for Windows environments
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 24678,
        clientPort: 24678, // Explicitly set client port for Windows
        timeout: 120000    // Increase timeout for better reliability
      },
      watch: {
        usePolling: true,  // Use polling for file changes (better for Windows)
        interval: 100      // Polling interval in ms
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router'] // Pre-bundle these dependencies for faster HMR
    }
  }
})
