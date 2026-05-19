### Overview
A new CommonJS module `electron/workspace-files.cjs` (lines 1‑85) exposes utilities for snapshot files used by the Electron renderer.

### Key changes
- **Imports** (R3‑R5): `fssync`, `fsp`, and `path` are required for synchronous existence checks, async I/O, and path resolution.  
- **`SKIP_DIRS`** (R7‑R15): a `Set` containing `.git`, `node_modules`, `dist`, `build`, `target`, `.novadiff-graph`, and `snapshots` that the walker ignores.  
- **`listSnapshotFiles(snapshotRoot, opts = {})`** (R17‑R60):  
  - Resolves `snapshotRoot` (R18).  
  - Uses `opts.maxFiles` (default 2500, R19).  
  - Recursively walks the directory tree (R25‑R55), skipping hidden entries except `.env` (R39‑R42) and directories in `SKIP_DIRS` (R47‑R49).  
  - Returns a sorted array of relative paths (R58).  
- **`readSnapshotTextFile(snapshotRoot, relPath, maxBytes = 512 KB)`** (R61‑R80):  
  - Validates `snapshotRoot` and `relPath` (R64‑R70).  
  - Reads the file asynchronously (R71).  
  - If the file exceeds `maxBytes`, returns the first `maxBytes` bytes, sets `truncated: true`, and reports the full size (R73‑R77).  
  - Otherwise returns the full content with `truncated: false` (R79).  
- **Exports** (R82‑R85): both functions are exported via `module.exports`.

### Impact
- **Path safety**: validation prevents directory traversal (R64‑R70).  
- **Memory guard**: large files are truncated to 512 KB (R73‑R77).  
- **Centralization**: snapshot file logic is now in a single module, reducing duplication.

### Risks & follow‑ups
- **Directory skipping**: verify that nested `.git` and `node_modules` directories are correctly ignored.  
- **Path validation**: test inputs with `..` or absolute paths to ensure the error is thrown.  
- **Truncation threshold**: confirm 512 KB suits the intended use cases; adjust if larger files are common.  
- **Edge cases**: add tests for empty roots, non‑existent files, and files exactly at the `maxBytes` limit.
