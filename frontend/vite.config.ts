import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Base path: '/' para domínio próprio/root, '/nome-do-repo/' para GitHub Pages em subfolder
    // Defina VITE_BASE_PATH no .env.production se usar GitHub Pages sem domínio custom
    base: env.VITE_BASE_PATH || '/',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 5173,
      // Proxy só ativo em desenvolvimento (quando VITE_API_URL não está definido)
      proxy: !env.VITE_API_URL
        ? {
            '/api': {
              target: 'http://localhost:8000',
              changeOrigin: true,
            },
          }
        : {},
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Quebra chunks grandes para melhor performance
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  }
})
