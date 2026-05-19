### Overview  
A new test file `packages/graph-core/src/persistence/persistence.test.ts` (lines 1‑204) was added to exercise the persistence API of the graph core module.

### Key changes  
- **Imports added** (lines 1‑6): Vitest helpers (`describe`, `it`, `expect`, `beforeEach`, `afterEach`) and Node utilities (`mkdtempSync`, `rmSync`, `existsSync`, `writeFileSync`, `join`, `tmpdir`).  
- **API coverage**: Tests for `saveGraph`/`loadGraph`, `saveMeta`/`loadMeta`, `saveFingerprints`/`loadFingerprints`, and `saveConfig`/`loadConfig`.  
- **Edge‑case checks**:  
  - Verify that files are written under `.<tempDir>/.novadiff-graph/`.  
  - Round‑trip equality of graph, meta, fingerprints, and config objects.  
  - `null` is returned when the expected file is missing.  
  - `loadGraph` throws on a fatally invalid graph and respects a `{ validate: false }` option.  
  - Corrupted JSON files result in `null` for fingerprints and config.  
- **Default config**: `loadConfig` falls back to `{ autoUpdate: false, outputLanguage: "en" }` when `config.json` is absent or corrupted.

### Impact  
- Provides automated regression checks for persistence logic, catching serialization/deserialization bugs.  
- Centralizes tests for future API changes.  
- Exposes failures early by asserting file existence and content equality.

### Risks & follow‑ups  
- Temporary directory creation (`mkdtempSync`) may fail on CI environments lacking write permissions; verify `/tmp` access.  
- Tests assume the storage path `.novadiff-graph`; any refactor of this path will break the suite.  
- Default config values are hard‑coded; changes to defaults will cause test failures.  
- Only `loadGraph` currently accepts a `{ validate: false }` flag; ensure other loaders honor similar options if added.
