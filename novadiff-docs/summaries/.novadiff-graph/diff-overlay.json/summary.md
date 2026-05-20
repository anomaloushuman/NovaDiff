### Overview  
A new file, `.novadiff-graph/diff-overlay.json`, was added to the repository (change kind: added, lines 1‑156). It contains metadata for the current diff run.

### Key changes  
- **File addition**: `.novadiff-graph/diff-overlay.json` now exists.  
- **Metadata fields**:  
  - `"version": "1.0.0"` (R2)  
  - `"baseBranch": "novadiff-compare"` (R3)  
  - `"generatedAt": "2026-05-20T01:19:05.929Z"` (R4)  
- **Changed files list** (`"changedFiles"` array, R5‑6): includes entries such as  
  - `electron/main.cjs`  
  - `packages/graph-view/src/App.tsx`  
  - `src/App.tsx`  
  (the array lists all files touched in this diff).  
- **Changed node IDs** (`"changedNodeIds"` array, R36‑154): a comprehensive list of file‑ and function‑level identifiers that were affected.  
- **Affected node IDs** (`"affectedNodeIds"` array, R155‑156): empty, indicating no nodes were explicitly marked beyond the changed ones.

### Impact  
- **Data source**: Consumers can read this JSON to determine which files and nodes changed.  
- **Versioning**: The `"version"` field allows future consumers to adapt to schema changes.  
- **Timestamping**: `"generatedAt"` provides a deterministic point for caching or debugging.  
- **Backward compatibility**: Existing code that ignores this file remains unaffected; new consumers must handle its absence gracefully.

### Risks & follow‑ups  
- **Consumer compatibility**: Verify that modules expecting a pre‑existing overlay file handle the new file correctly.  
- **Performance**: Loading a large `"changedNodeIds"` array could impact startup; benchmark if necessary.  
- **Test coverage**: Run targeted tests that read `diff-overlay.json` and confirm the node lists match expectations.  
- **Documentation**: Update any README or API docs that reference diff metadata to include the new file and its schema.
