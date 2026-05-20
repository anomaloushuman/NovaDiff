### Overview  
A new file, `.novadiff-graph/meta.json`, has been added to the repository. It contains a flat JSON object with metadata about the current diff‑graph snapshot.

### Key changes  
- **File addition**: `.novadiff-graph/meta.json` (lines 1‑6).  
- **Metadata fields**:  
  - `lastAnalyzedAt`: `2026-05-20T01:19:05.928Z` (line 2).  
  - `gitCommitHash`: `6c333f6cf037bf75318c26081cae3324fdb89c64` (line 3).  
  - `version`: `1.0.0` (line 4).  
  - `analyzedFiles`: `329` (line 5).  

### Impact  
- **Observability**: The timestamp and commit hash allow tools to report when the graph was last updated and which commit it represents.  
- **Versioning**: The `version` field provides a simple schema version that can be checked by consumers.  
- **Data integrity**: The commit hash ties the metadata to a specific repository state, aiding reproducibility.  

### Risks & follow‑ups  
- **Missing file handling**: Verify that consumers of the graph handle the absence of `meta.json` gracefully.  
- **Timestamp format**: Ensure downstream consumers parse the ISO‑8601 timestamp correctly.  
- **Commit hash consistency**: Confirm that the hash matches the current HEAD of the repository.  
- **File size**: The file is tiny, but check that adding it does not trigger any size limits in CI or packaging scripts.
