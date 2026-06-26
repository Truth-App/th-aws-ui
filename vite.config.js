import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
