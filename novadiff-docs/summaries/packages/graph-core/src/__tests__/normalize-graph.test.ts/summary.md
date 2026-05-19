### Overview  
A new test file `packages/graph-core/src/__tests__/normalize-graph.test.ts` (lines R1‑R498) has been added. It exercises the graph‑normalization utilities `normalizeNodeId`, `normalizeComplexity`, and `normalizeBatchOutput`, and verifies that the resulting graph satisfies the schema via `validateGraph`.

### Key changes  
- **Imports** – The test pulls `describe`, `it`, `expect` from `vitest` (R1), the three analyzer functions from `../analyzer/normalize-graph.js` (R2‑R6), and `validateGraph` from `../schema.js` (R7).  
- **Node ID normalization** – Tests cover correct IDs, double prefixes, project‑name stripping, bare paths, whitespace trimming, and handling of non‑code types (e.g., `module:`, `concept:`).  
- **Complexity mapping** – Assertions verify string aliases, numeric ranges, case‑insensitivity, and defaulting for undefined/negative values.  
- **Batch output normalization** – Checks include ID rewriting, numeric complexity conversion, edge rewriting, dangling edge removal, node/edge deduplication, and stats reporting (`idsFixed`, `complexityFixed`, `edgesRewritten`, `danglingEdgesDropped`).  
- **Integration test** – Wraps a normalized graph in a full schema object and asserts `validateGraph` succeeds (lines R444‑R496).

### Impact  
- Adds 498 lines of test code, increasing coverage of the normalization module.  
- Provides explicit assertions on normalization stats, aiding future regression detection.  
- Confirms that normalized graphs remain valid against the public JSON schema, protecting downstream consumers.

### Risks & follow‑ups  
- **Schema changes** – The integration test may fail if the schema evolves; run `vitest` after any schema update.  
- **Test stability** – No snapshots are used, but any change to output formatting could break tests; review failures carefully.  
- **Linting/build** – Ensure the new file passes the repository’s lint, test, and build pipelines (`npm run lint`, `npm test`, `npm run build`).  
- **Documentation** – Update any docs that reference normalization behavior to reflect the new edge‑rewriting and deduplication logic.
