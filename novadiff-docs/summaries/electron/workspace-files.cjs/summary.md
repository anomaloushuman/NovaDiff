### Overview  
A new CommonJS module `electron/workspace-files.cjs` (R1‑85) adds snapshot‑file utilities for the Electron renderer. It exports two async functions: `listSnapshotFiles` and `readSnapshotTextFile`.

### Key changes  
- **Imports** (R3‑R5): `node:fs`, `node:fs/promises`, and `node:path` are required for file system access and path resolution.  
- **SKIP_DIRS** (R7‑R14): Directories such as `.git`, `node_modules`, `dist`, `build`, `target`, `.novadiff-graph`, and `snapshots` are excluded from traversal.  
- **`listSnapshotFiles`** (R17‑R58):  
  - Resolves the root with `path.resolve` (R18).  
  - Limits to `maxFiles` (default 2500) (R19).  
  - Recursively walks the tree, skipping hidden files except `.env` (R39‑R42) and directories in `SKIP_DIRS` (R47‑R49).  
  - Returns a sorted array of relative paths with forward slashes (R58).  
- **`readSnapshotTextFile`** (R61‑R80):  
  - Validates `snapshotRoot` and `relPath`, rejecting paths containing `..` (R64‑R70).  
  - Reads the file via `fsp.readFile` (R71).  
  - Truncates content to `maxBytes` (default 512 KB) and reports `truncated` and `size` (R72‑R79).  
- **Exports** (R82‑R85): Both functions are exported.

### Impact  
- **Correctness**: Path validation prevents directory traversal.  
- **Safety**: Truncation to `maxBytes` limits memory usage.  
- **Convenience**: Centralized snapshot utilities reduce duplication across the repo.

### Risks & follow‑ups  
- **Large directories**: Verify that the `maxFiles` cap and async walk do not block the event loop.  
- **Hidden file handling**: Ensure `.env` files remain accessible while other dotfiles are skipped.  
- **Path traversal**: Test edge cases where `relPath` contains encoded `..` sequences.  
- **Truncation logic**: Confirm that `maxBytes` truncation correctly reports `size` and `truncated` flags.
