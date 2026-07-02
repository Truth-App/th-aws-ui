import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";

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
        // Avoid "unable to verify the first certificate" in local dev (corporate proxy / SSL chain issues).
        secure: false,
      },
    },
  },
});
