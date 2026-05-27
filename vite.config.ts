import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoRoot = path.resolve(__dirname);

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  base: "./",
  clearScreen: false,
  resolve: {
    alias: {
      "@novadiff/graph-core/types": path.resolve(
        __dirname,
        "packages/graph-core/src/types.ts",
      ),
      "@novadiff/graph-core/schema": path.resolve(
        __dirname,
        "packages/graph-core/src/schema.ts",
      ),
      "@novadiff/graph-core/search": path.resolve(
        __dirname,
        "packages/graph-core/src/search.ts",
      ),
      "@novadiff/graph-view": path.resolve(__dirname, "packages/graph-view/src"),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
    watch: {
      // NovaDiff writes these under the compared tree (often this repo in dev).
      // Without ignoring them, every summary/graph artifact triggers a full reload.
      ignored: [
        "**/electron/**",
        "**/release/**",
        "**/packages/graph-core/dist/**",
        "**/novadiff-docs/**",
        "**/.novadiff-graph/**",
        "**/cli/target/**",
        path.join(repoRoot, "novadiff-docs"),
        path.join(repoRoot, ".novadiff-graph"),
      ],
    },
  },
  optimizeDeps: {
    include: [
      "@xyflow/react",
      "zustand",
      "d3-force",
      "@dagrejs/dagre",
      "graphology",
      "elkjs/lib/elk.bundled.js",
      "three/webgpu",
    ],
    needsInterop: ["elkjs"],
  },
}));
