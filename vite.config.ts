import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// BASE_PATH wird vom GitHub-Workflow gesetzt (Projektseiten laufen unter /reponame/).
export default defineConfig({
  base: "./",
  plugins: [preact()],
  build: { target: "es2022", outDir: "dist" },
});
