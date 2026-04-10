import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = process.cwd();
  /** Sin prefijo VITE_: no van al bundle del cliente. */
  const env = loadEnv(mode, root, '');

  const catalogApiKey = env.CATALOG_API_KEY?.trim() ?? '';
  const proxyTarget = (env.API_PROXY_TARGET ?? 'http://localhost:5021').replace(/\/$/, '');

  const proxy: Record<string, import('vite').ProxyOptions> = {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
      configure(proxyServer) {
        proxyServer.on('proxyReq', (proxyReq) => {
          if (catalogApiKey) proxyReq.setHeader('X-Catalog-Key', catalogApiKey);
        });
      },
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy,
    },
    preview: {
      port: 4174,
      proxy,
    },
  };
});
