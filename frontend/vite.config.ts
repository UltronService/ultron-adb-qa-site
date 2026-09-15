import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const githubPagesBase = process.env.VITE_BASE_PATH ?? '/';

const agentProxy = {
  '/agent-api': {
    target: 'http://127.0.0.1:8765',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/agent-api/, ''),
  },
};

export default defineConfig({
  base: githubPagesBase,
  plugins: [react()],
  server: {
    port: 43123,
    host: true,
    proxy: agentProxy,
  },
  preview: {
    port: 43123,
    host: true,
    proxy: agentProxy,
  },
});
