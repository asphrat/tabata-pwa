import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" faz o app funcionar em qualquer subpasta (ex.: GitHub Pages)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
