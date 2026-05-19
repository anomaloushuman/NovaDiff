### Overview
The root `package.json` now declares a monorepo with two workspaces: `packages/graph-core` and `packages/graph-view` (added in lines 7‑10). Build and dev scripts delegate to these workspaces, and the Electron build config references the workspace outputs.

### Key changes
- **Workspaces**: `"workspaces": ["packages/graph-core","packages/graph-view"]` (R7‑R10).  
- **Scripts**: old `electron:dev` and `build` removed (L10‑L11). New workspace‑aware scripts added: `graph:core-build`, `graph:catalog:generate`, `graph:build`, and a new `electron:dev` that runs `graph:build` before the Electron dev server (R14‑R18).  
- **Dependencies**: local package references added: `"@novadiff/graph-core":"file:packages/graph-core"` and `"@novadiff/graph-view":"file:packages/graph-view"` (R24‑R26). `three` restored to dependencies (R26 removed, R43‑R44 added).  
- **DevDependencies**: `tailwindcss` added (R58).  
- **Electron build**: `files` array expanded to include `packages/graph-core/dist/**/*` and `packages/graph-core/package.json` (R74‑R75). The exclusion `node_modules/marked/**/*` removed and replaced by a blanket `node_modules/**/*` (L55 removed, R78 added).  
- **extraResources**: new block pointing to `cli/target/release` (R81‑R86).  
- **Targets**: mac, win, linux targets set to `nsis` and `AppImage` (R90‑R98).

### Impact
- Workspace scripts must resolve correctly; failures will break Electron dev/build.  
- The broader `node_modules/**/*` inclusion may increase bundle size; verify packaging.  
- Local package references (`file:`) require `npm ci` to resolve properly.

### Risks & follow‑ups
- Run `npm run graph:core-build` and `npm run graph:build` locally before building Electron.  
- Verify `npm ci` in root and each workspace resolves `file:` dependencies.  
- Test Electron builds on macOS, Windows, and Linux to confirm `extraResources` and target settings.  
- Check that the new `node_modules/**/*` inclusion does not package unnecessary files.
