### Overview
A new `package.json` (added at the repository root, lines R1‑R100) establishes the NovaDiff monorepo. It declares workspaces, build scripts, dependencies, and an Electron build configuration.

### Key changes
- **Workspaces** – `packages/graph-core` and `packages/graph-view` are added (lines R7‑R10).  
- **Scripts** – New commands (`dev`, `rust:build`, `graph:core-build`, `graph:catalog:generate`, `graph:build`, `electron:dev`, `build`, `electron:build`, `preview`, `test`) appear in lines R12‑R21.  
- **Dependencies** – Core libraries (`@dagrejs/dagre`, `@xyflow/react`, `d3-force`, `graphology`, etc.) and workspace references (`@novadiff/graph-core`, `@novadiff/graph-view`) are listed (lines R23‑R44).  
- **DevDependencies** – Electron tooling (`electron`, `electron-builder`), Vite, TypeScript, Tailwind, and concurrency utilities are added (lines R46‑R62).  
- **Electron build config** – The `build` section (lines R64‑R99) specifies `appId`, `productName`, `icon`, output directories, included files, extra resources, and platform targets (`mac`, `win`, `linux`).  
- **Module type** – `"type": "module"` and `"main": "electron/main.cjs"` set the entry point for the Electron main process (lines R5‑R6).

### Impact
- **Build pipeline** – `npm run build` orchestrates graph build, TypeScript compilation, and Vite bundling before Electron packaging.  
- **Workspace resolution** – Local package references (`file:`) require `npm install` to hoist dependencies correctly.  
- **Electron packaging** – `electron-builder` will generate installers for the specified platforms; missing assets (e.g., `nova-diff-icon.png`) will break packaging.  
- **Testing** – `vitest` is now a devDependency; existing test suites must run under the new workspace context.  
- **CLI integration** – `rust:build` points to `cli/Cargo.toml`; ensure the Rust target is available before Electron dev.

### Risks & follow‑ups
- **Dependency resolution** – Verify that workspace packages resolve without conflicts; run `npm install` and `npm dedupe`.  
- **Electron dev** – Test `npm run electron:dev` locally; confirm that the Vite dev server and Electron process start without errors.  
- **Build artifacts** – Ensure `electron-builder` produces installers for all target platforms; check `build.files` paths.  
- **CI pipeline** – Update CI scripts to include `npm run build` and `npm run test`; confirm that the new `vitest` configuration passes.
