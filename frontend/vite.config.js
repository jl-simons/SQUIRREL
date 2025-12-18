import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration pinned to a stable port and proxying backend to avoid cross-site cookies
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'squirrel-dev-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Avoid favicon 404 by redirecting to the provided SVG
          if (req.url === '/favicon.ico') {
            res.statusCode = 302;
            res.setHeader('Location', '/favicon.svg');
            return res.end();
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5175,
    strictPort: true,
    open: false,
    proxy: {
      // Proxy all backend routes through Vite so auth cookies are first-party on 5175
      '/backend': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        xfwd: true,
        // Strip the /backend prefix when forwarding to Flask
        rewrite: (path) => path.replace(/^\/backend/, ''),
        // Make cookies host-only so they work with both localhost and 127.0.0.1
        cookieDomainRewrite: { '*': '' },
        // Identify proxied requests to the backend so it can adjust redirects
        headers: {
          'x-forwarded-prefix': '/backend'
        }
      }
    }
  },
});
