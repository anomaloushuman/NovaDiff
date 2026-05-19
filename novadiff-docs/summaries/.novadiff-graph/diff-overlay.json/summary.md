### Overview  
A new JSON artifact, `.novadiff-graph/diff-overlay.json`, has been added. It contains metadata and a list of changed files from the latest diff.

### Key changes  
- File creation: lines 1‑1139 add `{` to start the JSON object.  
- Metadata: lines 2‑4 add `"version":"1.0.0"`, `"baseBranch":"novadiff-compare"`, and `"generatedAt":"2026-05-19T20:52:49.663Z"`.  
- Changed files: lines 5‑6 add `"changedFiles":[ ".gitignore" ]`.  
- No executable logic is present; the file is purely data.

### Impact  
- The artifact supplies data that can be consumed by the UI overlay component.  
- No code paths or runtime behavior are altered by this change.

### Risks & follow‑ups  
- The `"changedFiles"` array currently contains only `.gitignore`; future diffs should populate it with all changed files.  
- Verify that the UI correctly parses the JSON and displays the list of changed files.  
- Ensure the `"version"` field remains compatible with the NovaDiff schema.
