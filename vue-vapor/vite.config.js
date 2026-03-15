import { defineConfig, searchForWorkspaceRoot } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue({
      vapor: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@vue/runtime-vapor') || id.includes('node_modules/vue')) {
            return 'vue-vapor-vendor';
          }
          
        },
      },
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), "../shared"],
    },
  },
});
