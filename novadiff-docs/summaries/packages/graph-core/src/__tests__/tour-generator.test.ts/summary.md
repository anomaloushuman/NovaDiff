### Overview  
A new test file `packages/graph-core/src/__tests__/tour-generator.test.ts` (lines R1‑R269) has been added to validate the tour‑generation logic in the graph core module.

### Key changes  
- **Imports**: Added `vitest` helpers and the three tour‑generator functions from `../analyzer/tour-generator.js` (R1‑R6).  
- **Sample graph**: Defined a minimal `KnowledgeGraph` instance (`sampleGraph`) at lines 9‑37.  
- **Prompt tests**: Verify that `buildTourGenerationPrompt` includes project metadata, node summaries, layer names, and requests JSON output (lines 40‑67).  
- **Response‑parsing tests**: Cover valid JSON, markdown‑wrapped JSON, unparseable strings, and filtering of incomplete steps (lines 70‑158).  
- **Heuristic‑tour tests**: Assert entry‑point ordering, topological sequencing, concept‑node isolation, sequential order numbers, layer‑based grouping, and graceful handling of graphs with no edges or layers (lines 162‑268).

### Impact  
- Provides high‑coverage assertions for the core tour‑generation API; no runtime changes.  
- Centralizes test data (`sampleGraph`) reused across multiple test blocks.  
- No API changes; existing consumers remain unaffected.

### Risks & follow‑ups  
- Tests may fail if any of the three functions change; run `vitest` to confirm.  
- No snapshots are used, so no refresh is required.  
- Ensure the file passes linting (`npm run lint`); linting status is unknown from the diff.  
- Coverage impact is unknown; verify thresholds after adding the tests.
