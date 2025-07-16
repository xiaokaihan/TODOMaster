import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/dist'),
    },
    extensions: ['.js', '.ts', '.tsx', '.jsx', '.json'],
  },
  define: {
    // 确保环境变量在构建时被正确替换
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      mode === 'production' 
        ? 'https://todomaster-backend-1v0k.onrender.com/api'
        : '/api'
    ),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})) 