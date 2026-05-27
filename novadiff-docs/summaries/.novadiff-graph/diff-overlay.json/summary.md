### Overview  
The file **`.novadiff-graph/diff-overlay.json`** was deleted. It previously stored JSON metadata with keys `"changedFiles"`, `"changedNodeIds"`, `"affectedNodeIds"`, and a timestamp.

### Key changes  
- Entire file removed (lines 1‑430 deleted).  
- No other code changes appear in this diff.

### Impact  
- Any component or service that reads this file will throw a file‑not‑found error unless it is guarded.  
- Tests that assert the file’s existence or its contents will fail.  
- The removal eliminates the overhead of reading/parsing the JSON at startup, but the benefit is negligible.

### Risks & follow‑ups  
- Verify that any UI or logic that depended on the diff overlay data has been removed or protected against missing data.  
- Run the full test suite to catch residual references to the deleted file.  
- Update documentation or README sections that mention the diff overlay feature.  
- Ensure production builds do not expect this file; otherwise, the app may crash on launch.
