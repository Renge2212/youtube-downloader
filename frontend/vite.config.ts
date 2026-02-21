import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig({
  plugins: [react() as any],
  server: {
    port: 5173,
    strictPort: true, // ポートが使用中の場合は起動失敗
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
