### Overview  
`packages/graph-view/vite.config.ts` (added, lines 1‑362) introduces a Vite configuration that powers the NovaDiff dashboard. It creates a one‑time access token, a custom server middleware that serves graph files, configuration, and file content, and helper functions for path validation and graph‑file handling.

### Key changes  
- **Imports & token** – `defineConfig`, `react`, `tailwindcss`, `path`, `fs`, `crypto` (R2‑R7).  
- **Graph file utilities** – `graphFileCandidates`, `findGraphFile`, `projectRootFromGraphFile`, `normalizeGraphPath`, `graphFilePathSet` (lines 34‑71).  
- **Language detection** – `detectLanguage` maps extensions to language strings (lines 72‑102).  
- **HTTP helpers** – `sendJson`, `rejectFileRequest`, `readSourceFile` (lines 104‑177) enforce the token, sanitize paths, and validate file inclusion in the graph.  
- **Vite server config** – host `127.0.0.1`, port `5173`, auto‑open URL with token (lines 185‑191).  
- **Middleware** – serves `/knowledge-graph.json`, `/domain-graph.json`, `/diff-overlay.json`, `/meta.json`, `/config.json`, and `/file-content.json` with token checks, path sanitization, and graph‑file sanitisation (lines 236‑358).  
- **Console output** – prints dashboard URL once on server start (lines 239‑244).

### Impact  
- **Security** – token enforcement blocks unauthorized access to graph data.  
- **Correctness** – path normalization and graph‑file validation guard against traversal and missing files.  
- **Observability** – console log of the dashboard URL aids debugging.  
- **Compatibility** – relies on Node’s `fs`, `path`, and Vite 4 API; no breaking changes to existing projects.  
- **Performance** – reading and parsing graph files on each request may add latency; acceptable for development but could be cached in production.

### Risks & follow‑ups  
- **Token volatility** – without `NOVADIFF_GRAPH_ACCESS_TOKEN`, a new random token is generated on every restart (R12). Tests or CI may fail if a stable token is expected.  
- **Path sanitisation** – `normalizeGraphPath` may reject legitimate relative paths; verify against edge cases such as `../src`.  
- **Graph file discovery** – `graphFileCandidates` assumes `.novadiff-graph` directories; ensure build scripts create these paths.  
- **Middleware coverage** – confirm that all required endpoints (`/config.json`, `/file-content.json`) correctly handle missing or malformed files without leaking sensitive data.
