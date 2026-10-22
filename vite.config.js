import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function apiDevMiddleware() {
  async function manejarApi(req, res, next) {
    const ruta = (req.url || '').split('?')[0];
    if (ruta !== '/api/verificar') {
      next();
      return;
    }

    try {
      const { default: handler } = await import('./api/verificar.js');
      await handler(req, res);
    } catch (error) {
      console.error('Error en la API local:', error.message);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ valido: false }));
      }
    }
  }

  return {
    name: 'api-verificar-dev',
    configureServer(server) {
      server.middlewares.use(manejarApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(manejarApi);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [clave, valor] of Object.entries(env)) {
    if (process.env[clave] === undefined) {
      process.env[clave] = valor;
    }
  }

  return {
    plugins: [react(), apiDevMiddleware()],
  };
});
