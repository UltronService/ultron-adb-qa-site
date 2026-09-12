import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const githubPagesBase = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base: githubPagesBase,
  plugins: [react()],
  server: {
    port: 43123,
    host: true,
  },
});
