import { defineConfig, searchForWorkspaceRoot } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), svelte()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/svelte')) {
            return 'svelte';
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
