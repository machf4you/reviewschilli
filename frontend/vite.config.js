import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
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
      '.emergentagent.com',
    ],
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  define: {
    // Handle process.env for libraries that expect it
    'process.env': {},
  },
})
