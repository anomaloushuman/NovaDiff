### Overview  
A new persistence module (`packages/graph-core/src/persistence/index.ts`) centralises file handling for knowledge graphs, meta, fingerprints, and config. It replaces ad‑hoc logic with a single, well‑structured API.

### Key changes  
- **Imports & constants**: added `node:fs`/`node:path` helpers and file names (`GRAPH_FILE`, `META_FILE`, etc.) (lines 1‑11).  
- **`ensureDir(projectRoot)`** (lines 13‑19) guarantees the `.novadiff-graph` folder exists.  
- **`sanitiseFilePaths(graph, projectRoot)`** (lines 38‑66) converts absolute paths to project‑relative or just the filename, preventing leakage of developer directories.  
- **`saveGraph` / `loadGraph`** (lines 69‑106) now sanitise before persisting and validate on load via `validateGraph`.  
- **`saveMeta` / `loadMeta`**, **`saveFingerprints` / `loadFingerprints`**, **`saveConfig` / `loadConfig`** (lines 107‑148) provide CRUD for auxiliary data, with graceful fallbacks on missing or malformed files.  
- **Domain graph support** (`saveDomainGraph` / `loadDomainGraph`, lines 152‑182) mirrors the main graph logic.  
- Default config (`DEFAULT_CONFIG`) and error‑safe parsing for config files (lines 140‑147).

### Impact  
- Sanitisation removes sensitive absolute paths; validation throws an `Error` on malformed graphs.  
- All persistence logic lives in one module, reducing duplication.  
- Default config is returned when the file is absent or corrupted.

### Risks & follow‑ups  
- Verify `sanitiseFilePaths` correctly handles paths inside, outside, and already relative to `projectRoot`.  
- Callers of `loadGraph`/`loadDomainGraph` must handle thrown errors or disable validation (`options?.validate === false`).  
- Confirm `loadConfig` returns the intended defaults when the file is missing or corrupted.  
- Ensure the new module is re‑exported from the package’s public index so external consumers can access these helpers.
