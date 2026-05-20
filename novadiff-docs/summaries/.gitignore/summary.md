### Overview  
A new `.gitignore` file was added at the repository root (line range R1‑38). It contains ignore rules for logs, build artifacts, editor metadata, and tool‑specific directories.

### Key changes  
- Added `.gitignore` (R1‑38).  
- Excludes log files: `*.log`, `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`, `pnpm-debug.log*`, `lerna-debug.log*` (lines 1‑6).  
- Ignores build and distribution directories: `node_modules`, `dist`, `dist-ssr`, `packages/graph-core/dist` (lines 10‑12, 38).  
- Skips editor/IDE metadata: `.vscode/*`, `!.vscode/extensions.json`, `.idea`, `.DS_Store`, `*.suo`, `*.ntvs*`, `*.njsproj`, `*.sln`, `*.sw?` (lines 15‑24).  
- Excludes Rust CLI target (`cli/target`) and Electron installer output (`release`) (lines 26‑30).  
- Omits legacy clone directory (`understandanything/`) and temporary folder `Bn` (lines 34‑36).

### Impact  
- Centralizes ignore rules, simplifying future updates.  
- Git and CI tools will now respect these ignores; no code changes are required.  
- CI logs may be cleaner, but verify that any required artifacts are not inadvertently ignored.

### Risks & follow‑ups  
- Confirm that `packages/graph-core/dist` is not needed in the repo; adjust the ignore if necessary.  
- Run the test suite and CI pipeline to ensure ignored files do not affect tests or deployment scripts.  
- Verify that the `!.vscode/extensions.json` rule still allows necessary VS Code settings to be tracked.  
- Ensure that excluding `understandanything/` does not hide needed legacy files for downstream consumers.
