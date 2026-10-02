import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('proxy error', err));
        }
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/lp': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 3D visualization and Geo mapping (Three.js, MapLibre, D3)
            if (
              id.includes('/three/') ||
              id.includes('/maplibre-gl/') ||
              id.includes('/react-simple-maps/') ||
              id.includes('/d3-scale/')
            ) {
              return 'vendor-three-geo';
            }
            // Charting libraries (ApexCharts, Chart.js, Google Charts)
            if (
              id.includes('/apexcharts/') ||
              id.includes('/react-apexcharts/') ||
              id.includes('/chart.js/') ||
              id.includes('/react-chartjs-2/') ||
              id.includes('/react-google-charts/')
            ) {
              return 'vendor-charts';
            }
            // Rich text & Code editors (TipTap, Monaco Editor, Lowlight)
            if (
              id.includes('/@tiptap/') ||
              id.includes('/@monaco-editor/') ||
              id.includes('/monaco-editor/') ||
              id.includes('/lowlight/')
            ) {
              return 'vendor-editor';
            }
            // Drag-and-drop builders
            if (
              id.includes('/@dnd-kit/') ||
              id.includes('/react-dnd/') ||
              id.includes('/react-dnd-html5-backend/')
            ) {
              return 'vendor-dnd';
            }
            // Ant Design Core components, Icons & RC primitives
            if (
              id.includes('/antd/') ||
              id.includes('/@ant-design/') ||
              id.includes('/rc-')
            ) {
              return 'vendor-antd';
            }
            // Core React runtime
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  }
})