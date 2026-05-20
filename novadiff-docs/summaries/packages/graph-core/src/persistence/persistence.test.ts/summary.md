### Overview  
A new test file `packages/graph-core/src/persistence/persistence.test.ts` (lines R1‑R204) has been added to exercise the persistence layer’s read/write functions for knowledge graphs, meta data, fingerprints, and configuration.

### Key changes  
- **Imports** (lines R1‑R6):  
  - `vitest` helpers (`describe`, `it`, `expect`, `beforeEach`, `afterEach`).  
  - Node utilities (`mkdtempSync`, `rmSync`, `existsSync`, `join`, `tmpdir`, `writeFileSync`).  
  - Persistence API (`saveGraph`, `loadGraph`, `saveMeta`, `loadMeta`, `saveFingerprints`, `loadFingerprints`, `saveConfig`, `loadConfig`).  
- **Sample data**:  
  - `sampleGraph` (type `KnowledgeGraph`) defined at lines R21‑R68.  
  - `sampleMeta` (type `AnalysisMeta`) at lines R70‑R75.  
  - `sampleFingerprints` (type `FingerprintStore`) at lines R140‑R156.  
- **Test cases** (lines R77‑R203):  
  - Verify file creation and round‑trip integrity for each persistence function.  
  - Confirm `load*` returns `null` when the expected file is missing.  
  - Check error handling for an invalid graph (`project: null`) and for corrupted JSON files.  
  - Validate that `loadConfig` falls back to `{ autoUpdate: false, outputLanguage: "en" }` when `config.json` is absent or malformed.

### Impact  
- **Correctness**: Tests confirm that serialization and deserialization work for all persistence APIs.  
- **Maintainability**: Centralized sample data and expectations make future API changes easier to detect.  
- **Observability**: Failure points are clear for missing files, validation errors, and corrupted data.

### Risks & follow‑ups  
- **Regression risk**: Any change to the signatures of `save*`/`load*` will cause these tests to fail; run `npm test` after refactors.  
- **Default config drift**: Verify that `loadConfig` still returns the expected defaults when `config.json` is missing or corrupted.  
- **File system permissions**: Tests create temporary directories; ensure CI environments allow write access.  
- **Performance**: Temporary directory creation/deletion may affect CI runtime; monitor for slowdowns.
