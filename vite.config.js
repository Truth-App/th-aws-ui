import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import https from "node:https";
import react from "@vitejs/plugin-react";

const API_HOST = "https://y4cbvwkmfa.execute-api.ap-south-2.amazonaws.com";
const proxyAgent = new https.Agent({ rejectUnauthorized: false });

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
        target: API_HOST,
        changeOrigin: true,
        secure: false,
        agent: proxyAgent,
      },
    },
  },
});
