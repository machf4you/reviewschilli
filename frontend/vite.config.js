import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.preview.emergentagent.com',
      '.preview.emergentcf.cloud',
      '.cluster-12.preview.emergentcf.cloud'
    ],
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
})
