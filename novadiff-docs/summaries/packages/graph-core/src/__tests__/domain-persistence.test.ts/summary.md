### Overview
A new test file `packages/graph-core/src/__tests__/domain-persistence.test.ts` has been added to validate the domain‑graph persistence API.

### Key changes
- **Imports** (lines 1‑6): `vitest` helpers, Node `fs`, `path`, `os` modules, and the persistence functions `saveDomainGraph`, `loadDomainGraph` plus the `KnowledgeGraph` type.
- **Test root** (line 8): `const testRoot = join(tmpdir(), "ua-domain-persist-test")`.
- **Sample graph** (lines 10‑33): a minimal `KnowledgeGraph` object with a single domain node.
- **Tests** (lines 35‑64):
  1. *Save & load* – writes the graph with `saveDomainGraph`, reads it back with `loadDomainGraph`, and checks the node id (lines 45‑50).
  2. *Missing graph* – verifies `loadDomainGraph` returns `null` when no file exists (lines 52‑55).
  3. *File naming* – ensures the graph is stored as `domain-graph.json` inside `.novadiff-graph` and that `knowledge-graph.json` is absent (lines 57‑62).

### Impact
- Adds runtime assurance for the persistence layer; no production code is altered.
- Uses temporary filesystem operations with cleanup in `beforeEach`/`afterEach` (lines 36‑43).
- Introduces a test dependency on `vitest` and Node core modules.

### Risks & follow‑ups
- If `saveDomainGraph` changes its output path, the test may fail; verify the `.novadiff-graph` directory is created correctly.
- Cleanup race conditions: ensure no concurrent tests use the same temporary directory.
- CI environments may restrict write access to `tmpdir`; confirm permissions before integration.
- If the `KnowledgeGraph` type evolves, the literal object may need updating; keep the import in sync.
