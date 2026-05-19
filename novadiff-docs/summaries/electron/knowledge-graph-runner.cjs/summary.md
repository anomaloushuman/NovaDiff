### Overview  
A new `electron/knowledge-graph-runner.cjs` file is added. It exposes three public APIs: `resolveRepoRoot`, `ensureGraphCoreBuilt`, and `buildKnowledgeGraph` (lines 515‑671). The module replaces an earlier ad‑hoc script by providing a deterministic pipeline that builds a knowledge graph for a given project root.

### Key changes  
- **Exports** – `resolveRepoRoot`, `ensureGraphCoreBuilt`, `buildKnowledgeGraph` (lines 515‑671).  
- **Node imports** – `fs`, `fsp`, `path`, `os`, `spawn`, `pathToFileURL`, `createRequire` (lines 3‑9).  
- **Constants** – `BATCH_SIZE`, `MAX_FILES`, `EXTRACT_TIMEOUT_MS` (lines 11‑14).  
- **File discovery** – `walkProjectFiles` (lines 147‑185) filters directories in `SKIP_DIRS` and skips files >512 KB.  
- **Language detection** – `detectLanguage` (lines 187‑232) maps extensions to language IDs.  
- **Import resolution** – `resolveRelativeImport` (lines 244‑279) and `buildBatchImportData` (lines 281‑303).  
- **Graph assembly** – `mapStructuralAnalysis`, `buildFileMeta`, `buildLayersFromFiles`, `assignNodeLayers`, `buildDiffOverlay` (lines 344‑496).  
- **Git integration** – `getGitHash` (lines 497‑504).  
- **Batch extraction** – `runExtractStructureBatch` (lines 306‑342) writes a temporary JSON payload, runs `graph/extract-structure.mjs`, and parses the result.  
- **Progress reporting** – optional `onProgress` callback is invoked during scanning, extraction, and assembly.  
- **Output** – writes `knowledge-graph.json` and, if `changedPaths` are supplied, `diff-overlay.json` into `.novadiff-graph` (lines 631‑654).

### Impact  
- **Deterministic graph generation** via Tree‑sitter; no LLM is involved.  
- **Memory safety** – batch limits (`BATCH_SIZE`, `MAX_FILES`) prevent runaway usage.  
- **Modular design** – functions have clear responsibilities, easing testing and maintenance.  
- **Electron compatibility** – child processes are launched with `ELECTRON_RUN_AS_NODE` when needed (lines 54‑58).  
- **Observability** – progress callbacks provide real‑time feedback during long scans.

### Risks & follow‑ups  
- **Missing dependencies** – `packages/graph-core` or `graph/extract-structure.mjs` must exist; otherwise `ensureGraphCoreBuilt` throws (lines 521‑524).  
- **Spawn behavior** – verify that `spawn` with `ELECTRON_RUN_AS_NODE` works on all target platforms.  
- **Large projects** – `MAX_FILES` may truncate analysis; confirm the limit is acceptable for typical repositories.  
- **Error handling** – `runCommand` propagates raw stderr; callers should handle failures gracefully.
