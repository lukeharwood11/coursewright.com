import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { seoPublicAssets } from "./scripts/vite-seo-assets.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPublicAssets()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["@react-pdf/renderer"],
  },
});
