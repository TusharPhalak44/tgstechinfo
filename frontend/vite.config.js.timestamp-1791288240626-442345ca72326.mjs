// vite.config.js
import { defineConfig } from "file:///C:/Users/Nakshtra/OneDrive/Desktop/TgsTechInfo/tgstechinfo/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Nakshtra/OneDrive/Desktop/TgsTechInfo/tgstechinfo/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Nakshtra\\OneDrive\\Desktop\\TgsTechInfo\\tgstechinfo\\frontend";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => console.log("proxy error", err));
        }
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },
      "/lp": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },
      "/sitemap.xml": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("/three/") || id.includes("/maplibre-gl/") || id.includes("/react-simple-maps/") || id.includes("/d3-scale/")) {
              return "vendor-three-geo";
            }
            if (id.includes("/apexcharts/") || id.includes("/react-apexcharts/") || id.includes("/chart.js/") || id.includes("/react-chartjs-2/") || id.includes("/react-google-charts/")) {
              return "vendor-charts";
            }
            if (id.includes("/@tiptap/") || id.includes("/@monaco-editor/") || id.includes("/monaco-editor/") || id.includes("/lowlight/")) {
              return "vendor-editor";
            }
            if (id.includes("/@dnd-kit/") || id.includes("/react-dnd/") || id.includes("/react-dnd-html5-backend/")) {
              return "vendor-dnd";
            }
            if (id.includes("/antd/") || id.includes("/@ant-design/") || id.includes("/rc-")) {
              return "vendor-antd";
            }
            if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/react-router/") || id.includes("/react-router-dom/")) {
              return "vendor-react";
            }
          }
        }
      }
    }
  },
  css: {
    postcss: "./postcss.config.js"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOYWtzaHRyYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFRnc1RlY2hJbmZvXFxcXHRnc3RlY2hpbmZvXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOYWtzaHRyYVxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXFRnc1RlY2hJbmZvXFxcXHRnc3RlY2hpbmZvXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9OYWtzaHRyYS9PbmVEcml2ZS9EZXNrdG9wL1Rnc1RlY2hJbmZvL3Rnc3RlY2hpbmZvL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjUwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5KSA9PiB7XHJcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyKSA9PiBjb25zb2xlLmxvZygncHJveHkgZXJyb3InLCBlcnIpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgICcvdXBsb2Fkcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlXHJcbiAgICAgIH0sXHJcbiAgICAgICcvbHAnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZVxyXG4gICAgICB9LFxyXG4gICAgICAnL3NpdGVtYXAueG1sJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICAgICAgICAgIC8vIDNEIHZpc3VhbGl6YXRpb24gYW5kIEdlbyBtYXBwaW5nIChUaHJlZS5qcywgTWFwTGlicmUsIEQzKVxyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy90aHJlZS8nKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvbWFwbGlicmUtZ2wvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3JlYWN0LXNpbXBsZS1tYXBzLycpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9kMy1zY2FsZS8nKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci10aHJlZS1nZW8nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIENoYXJ0aW5nIGxpYnJhcmllcyAoQXBleENoYXJ0cywgQ2hhcnQuanMsIEdvb2dsZSBDaGFydHMpXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL2FwZXhjaGFydHMvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3JlYWN0LWFwZXhjaGFydHMvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL2NoYXJ0LmpzLycpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9yZWFjdC1jaGFydGpzLTIvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3JlYWN0LWdvb2dsZS1jaGFydHMvJylcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItY2hhcnRzJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBSaWNoIHRleHQgJiBDb2RlIGVkaXRvcnMgKFRpcFRhcCwgTW9uYWNvIEVkaXRvciwgTG93bGlnaHQpXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL0B0aXB0YXAvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL0Btb25hY28tZWRpdG9yLycpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9tb25hY28tZWRpdG9yLycpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9sb3dsaWdodC8nKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1lZGl0b3InO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIERyYWctYW5kLWRyb3AgYnVpbGRlcnNcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvQGRuZC1raXQvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3JlYWN0LWRuZC8nKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvcmVhY3QtZG5kLWh0bWw1LWJhY2tlbmQvJylcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItZG5kJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBBbnQgRGVzaWduIENvcmUgY29tcG9uZW50cywgSWNvbnMgJiBSQyBwcmltaXRpdmVzXHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL2FudGQvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL0BhbnQtZGVzaWduLycpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9yYy0nKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1hbnRkJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBDb3JlIFJlYWN0IHJ1bnRpbWVcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvcmVhY3QvJykgfHxcclxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3JlYWN0LWRvbS8nKSB8fFxyXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvcmVhY3Qtcm91dGVyLycpIHx8XHJcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9yZWFjdC1yb3V0ZXItZG9tLycpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXJlYWN0JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgY3NzOiB7XHJcbiAgICBwb3N0Y3NzOiAnLi9wb3N0Y3NzLmNvbmZpZy5qcycsXHJcbiAgfVxyXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlksU0FBUyxvQkFBb0I7QUFDeGEsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsV0FBVyxDQUFDLFVBQVU7QUFDcEIsZ0JBQU0sR0FBRyxTQUFTLENBQUMsUUFBUSxRQUFRLElBQUksZUFBZSxHQUFHLENBQUM7QUFBQSxRQUM1RDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsZ0JBQWdCO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCx1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixhQUFhLElBQUk7QUFDZixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFFL0IsZ0JBQ0UsR0FBRyxTQUFTLFNBQVMsS0FDckIsR0FBRyxTQUFTLGVBQWUsS0FDM0IsR0FBRyxTQUFTLHFCQUFxQixLQUNqQyxHQUFHLFNBQVMsWUFBWSxHQUN4QjtBQUNBLHFCQUFPO0FBQUEsWUFDVDtBQUVBLGdCQUNFLEdBQUcsU0FBUyxjQUFjLEtBQzFCLEdBQUcsU0FBUyxvQkFBb0IsS0FDaEMsR0FBRyxTQUFTLFlBQVksS0FDeEIsR0FBRyxTQUFTLG1CQUFtQixLQUMvQixHQUFHLFNBQVMsdUJBQXVCLEdBQ25DO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQ0UsR0FBRyxTQUFTLFdBQVcsS0FDdkIsR0FBRyxTQUFTLGtCQUFrQixLQUM5QixHQUFHLFNBQVMsaUJBQWlCLEtBQzdCLEdBQUcsU0FBUyxZQUFZLEdBQ3hCO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQ0UsR0FBRyxTQUFTLFlBQVksS0FDeEIsR0FBRyxTQUFTLGFBQWEsS0FDekIsR0FBRyxTQUFTLDJCQUEyQixHQUN2QztBQUNBLHFCQUFPO0FBQUEsWUFDVDtBQUVBLGdCQUNFLEdBQUcsU0FBUyxRQUFRLEtBQ3BCLEdBQUcsU0FBUyxlQUFlLEtBQzNCLEdBQUcsU0FBUyxNQUFNLEdBQ2xCO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQ0UsR0FBRyxTQUFTLFNBQVMsS0FDckIsR0FBRyxTQUFTLGFBQWEsS0FDekIsR0FBRyxTQUFTLGdCQUFnQixLQUM1QixHQUFHLFNBQVMsb0JBQW9CLEdBQ2hDO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxFQUNYO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
