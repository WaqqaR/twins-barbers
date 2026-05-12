import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the frontend runs on :5173 and the API (Express) on :4400.
// We proxy /api calls to the Express server so the browser only ever
// talks to one origin. In production (Vercel) /api is served by the
// serverless function in /api/[...path].js, so no proxy is needed.
const API_PORT = process.env.PORT || 4400;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
