/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const target = { target: process.env.BACKEND_URL ?? 'http://localhost:8080', changeOrigin: true }
// ws: the job event stream (/api/v1/jobs/{id}/events) is a WebSocket on the same origin.
const proxy = { '/healthz': target, '/api': { ...target, ws: true } }

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/setupTests.ts'], css: false },
})
