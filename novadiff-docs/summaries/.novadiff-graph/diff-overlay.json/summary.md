### Overview  
The `diff-overlay.json` file was updated: the `generatedAt` timestamp changed from `2026‑05‑26T07:21:38.024Z` to `2026‑05‑27T04:48:24.800Z` (L4).  
The `changedFiles` array was trimmed to only four entries:  
- `.novadiff-graph/diff-overlay.json` (L5)  
- `.novadiff-graph/knowledge-graph.json` (L6)  
- `.novadiff-graph/meta.json` (L7)  
- `src/App.css` (L27)  
All other file paths were removed.  
The `changedNodeIds` array was cleared (L28).

### Key changes  
- Timestamp update – `generatedAt` changed (L4).  
- `changedFiles` now contains only the four files listed above (L5‑L8, L27).  
- `changedNodeIds` is an empty array (L28).

### Impact  
- Downstream consumers will no longer receive change notifications for the removed files; if those files are required, updates will be missed.  
- The JSON payload is smaller, reducing parsing and transmission overhead.  
- Tools that previously expected the larger `changedFiles` list may need to be updated.

### Risks & follow‑ups  
- Verify that UI diff viewers and CI checks still function with the reduced file list.  
- Confirm that clearing `changedNodeIds` was intentional; run a smoke test to ensure no node‑level changes are omitted.  
- Ensure the new `generatedAt` value is produced by the build pipeline, not hard‑coded.
