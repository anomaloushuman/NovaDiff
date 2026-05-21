### Overview  
The file `.novadiff-graph/diff-overlay.json` has been deleted entirely (lines 1‑156). It previously stored metadata for the diff overlay, including the version, base branch, generation timestamp, lists of changed files, changed node IDs, and affected node IDs.

### Key changes  
- Removal of the JSON file at `.novadiff-graph/diff-overlay.json`.  
- All persisted data (`"changedFiles"`, `"changedNodeIds"`, `"affectedNodeIds"`) is no longer available.  
- No new file or alternative storage was added in this commit.

### Impact  
- Code that reads or writes this file (e.g., `fs.readFileSync('.novadiff-graph/diff-overlay.json')`) will now throw an `ENOENT` error.  
- Tests that depend on the presence of this file will fail unless updated.  
- The version (`"version": "1.0.0"`) and timestamp (`"generatedAt"`) information are lost, reducing auditability of overlay generation.  
- Components that previously loaded this data for rendering (such as the graph view) must be updated to use an alternative source or handle the missing file gracefully.

### Risks & follow‑ups  
- **Regression risk**: Any path that assumes the file exists will crash. Run targeted tests that touch diff‑overlay logic.  
- **Compatibility risk**: External tooling importing this JSON for configuration will break. Verify that no such imports remain.  
- **Observability risk**: Loss of the `"generatedAt"` timestamp may hinder debugging of stale overlays. Consider adding a fallback logging mechanism.  
- **Documentation**: Update any docs or README sections that reference the diff overlay file.
