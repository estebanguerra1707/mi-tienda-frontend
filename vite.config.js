import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",          // carpeta de salida
    sourcemap: false,        // no necesitamos sourcemaps en prod
    chunkSizeWarningLimit: 1500, // evita warnings por bundles grandes
  },
});