import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-radix': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-slider',
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-dropdown-menu',
          ],
          'vendor-ui': ['framer-motion', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts', 'd3'],
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
});
