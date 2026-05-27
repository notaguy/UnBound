import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Pentru GitHub Pages: VITE_BASE_PATH=/nume-repo/ la build (vezi workflow)
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
});
