### Overview  
`electron/knowledge-graph-runner.cjs` is a new module that builds a deterministic knowledge graph for a codebase. It scans the project, runs a Tree‑sitter‑based extractor, resolves imports, and writes `knowledge-graph.json` and an optional `diff-overlay.json` into `.novadiff-graph`.

### Key changes  
- **Imports added** (lines 1‑8): `fs`, `fsp`, `path`, `os`, `spawn`, `pathToFileURL`, `createRequire`.  
- **Constants** (lines 11‑32): `BATCH_SIZE`, `MAX_FILES`, `EXTRACT_TIMEOUT_MS`, `MAX_ANALYZE_LINES`, `SKIP_DIRS`.  
- **Repository helpers** (lines 34‑43): `resolveRepoRoot`.  
- **Node execution helpers** (lines 45‑60): `resolveNodeExecutable`, `nodeChildEnv`, `runCommand`.  
- **File‑system utilities** (lines 147‑185): `walkProjectFiles`, `isTextCandidate`.  
- **Language & import resolution** (lines 187‑279): `detectLanguage`, `fileCategory`, `resolveRelativeImport`.  
- **Batch extraction** (lines 281‑342): `buildBatchImportData`, `runExtractStructureBatch`.  
- **Graph construction helpers** (lines 344‑496): `mapStructuralAnalysis`, `buildFileMeta`, `buildLayersFromFiles`, `assignNodeLayers`, `buildDiffOverlay`.  
- **Git integration** (lines 497‑504): `getGitHash`.  
- **Core orchestration** (lines 515‑671): `buildKnowledgeGraph` – scans, batches, extracts, assembles the graph, writes files, and reports progress.  
- **Exports** (lines 673‑677): `resolveRepoRoot`, `ensureGraphCoreBuilt`, `buildKnowledgeGraph`.  
- **Build helper** (lines 103‑111): `ensureGraphCoreBuilt` compiles the graph engine if needed.

### Impact  
- Enables deterministic graph generation without LLMs, suitable for CI or diff tooling.  
- Limits extraction to 24 files per batch (`BATCH_SIZE`) and 800 files total (`MAX_FILES`) to keep memory usage bounded.  
- Requires the `packages/graph-core` package and the `graph/extract-structure.mjs` script; otherwise `ensureGraphCoreBuilt` or `runExtractStructureBatch` will throw.  
- Sets `ELECTRON_RUN_AS_NODE` when the Node executable matches the Electron binary, allowing child processes to run as Node.  
- Emits progress via the optional `onProgress` callback and records timestamps and the current Git commit hash in the meta file.

### Risks & follow‑ups  
- **Missing core**: `packages/graph-core` must exist and be built; otherwise `buildKnowledgeGraph` fails.  
- **Extraction script**: `graph/extract-structure.mjs` must be present; its absence triggers a clear error.  
- **Timeouts**: `EXTRACT_TIMEOUT_MS` (12 min) may need adjustment for very large projects; monitor for “Timed out” errors.  
- **Path handling**: `resolveRelativeImport` normalizes POSIX paths; verify cross‑platform behavior on Windows.
