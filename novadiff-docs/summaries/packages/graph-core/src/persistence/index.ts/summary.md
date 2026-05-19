### Overview  
A new persistence module (`packages/graph-core/src/persistence/index.ts`) is added. It centralises file‑system helpers for knowledge graphs, metadata, fingerprints, and configuration. The module introduces path sanitisation, directory creation, and optional schema validation.

### Key changes  
- **Imports** (lines 1‑5) bring in `fs`, `path`, type definitions, and `validateGraph`.  
- **`ensureDir(projectRoot)`** (lines 13‑19) creates the `.novadiff-graph` directory if missing and returns its path.  
- **`sanitiseFilePaths(graph, projectRoot)`** (lines 38‑66) converts absolute node paths to relative or filename‑only forms, preventing leakage of the developer’s directory layout.  
- **`saveGraph` / `loadGraph`** (lines 69‑106) persist the graph as `knowledge-graph.json`. `loadGraph` optionally validates via `validateGraph`.  
- **`saveMeta` / `loadMeta`** (lines 107‑116) handle `meta.json`.  
- **`saveFingerprints` / `loadFingerprints`** (lines 118‑131) manage `fingerprints.json`.  
- **`saveConfig` / `loadConfig`** (lines 135‑148) read/write `config.json` with a default `{ autoUpdate: false, outputLanguage: "en" }`.  
- **`saveDomainGraph` / `loadDomainGraph`** (lines 152‑182) mirror graph persistence under `domain-graph.json`.  

### Impact  
- **Privacy**: Sanitisation guarantees that no absolute paths are written to disk.  
- **Data integrity**: Validation in `loadGraph`/`loadDomainGraph` throws on malformed data, preventing downstream errors.  
- **Maintainability**: Centralised persistence logic replaces scattered file handling across the repo.  
- **Compatibility**: Callers must import the new functions from this module; legacy imports may need updating.

### Risks & follow‑ups  
- **Windows path handling**: `isAbsolute` and `relative` may behave differently; run tests on Windows to confirm sanitisation.  
- **Error propagation**: `loadGraph` throws on validation failure; callers should handle or catch this exception.  
- **Directory creation**: `ensureDir` assumes `projectRoot` is writable; verify permissions in CI environments.  
- **Backward compatibility**: If older code expected a different file layout, update imports accordingly and run integration tests.
