import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const pkg = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

// Relativer Basispfad: läuft unter jedem Unterverzeichnis, ohne dass der
// Workflow etwas setzen muss.
export default defineConfig({
  base: "./",
  plugins: [preact()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { target: "es2022", outDir: "dist" },
});
