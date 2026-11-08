import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages serves the web build under /off-script-life-os/.
    // Capacitor loads index.html from the device itself, so absolute
    // base paths 404 there (blank screen) — mobile builds use './'.
    base: process.env.CAPACITOR_BUILD ? './' : '/off-script-life-os/',
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // React + React DOM change rarely; isolate them so app edits
          // don't invalidate the framework chunk in repeat-visit caches.
          // (Rolldown requires the function form of manualChunks.)
          manualChunks: (id: string) => {
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
