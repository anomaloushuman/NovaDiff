### Overview  
A new test suite `packages/graph-core/src/__tests__/tour-generator.test.ts` (lines R1‑R269) has been added to validate the tour‑generation logic.

### Key changes  
- **Imports added**: `vitest` helpers and the three tour‑generator functions  
  `buildTourGenerationPrompt`, `parseTourGenerationResponse`, `generateHeuristicTour` (R1‑R6).  
- **Sample graph**: a fully‑featured `KnowledgeGraph` instance (`sampleGraph`) is constructed inline (R9‑R37).  
- **Prompt tests**: verify that `buildTourGenerationPrompt` includes project metadata, node summaries, layer names, and requests JSON output (R39‑R68).  
- **Response‑parsing tests**: cover valid JSON, markdown code blocks, unparseable strings, and filtering of incomplete steps (R70‑R158).  
- **Heuristic‑tour tests**: assert entry‑point ordering, topological sequencing, concept‑node isolation, sequential order numbers, layer grouping, and graceful handling of graphs with no edges or layers (R162‑R268).

### Impact  
- **Correctness**: the suite will surface regressions in prompt construction, response parsing, and tour ordering logic.  
- **Coverage**: adds ~270 lines of test code, exercising many branches of the tour‑generator module.  
- **Maintainability**: the sample graph is self‑contained, simplifying future test modifications.  
- **Performance**: tests run quickly; no heavy I/O or network calls, so build times should remain unaffected.

### Risks & follow‑ups  
- **API changes**: if the tour‑generator signatures or output format change, tests will fail; review the implementation before merging.  
- **Snapshot drift**: the tests assert string contents; cosmetic changes to prompts or titles will trigger failures—verify intent before updating.  
- **Edge‑case coverage**: while many scenarios are covered, rare graph structures may still be untested; consider adding additional edge cases if new features are introduced.  
- **Linting & build**: run `npm run lint`, `npm test`, and `npm run build` to ensure the new file does not introduce style or type errors.
