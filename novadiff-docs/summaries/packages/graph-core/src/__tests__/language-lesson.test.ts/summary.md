### Overview  
A new test file `packages/graph-core/src/__tests__/language-lesson.test.ts` (lines 1‑157) has been added. It imports Vitest helpers, the analyzer functions (`buildLanguageLessonPrompt`, `parseLanguageLessonResponse`, `detectLanguageConcepts`), the `GraphNode`/`GraphEdge` types, and the TypeScript language config. Sample graph data (`sampleNode`, `sampleEdges`) is defined to exercise the utilities.

### Key changes  
- **File added**: `packages/graph-core/src/__tests__/language-lesson.test.ts`.  
- **Imports**: Lines 1‑8 bring in Vitest, the analyzer exports, type definitions, and the TypeScript config.  
- **Sample data**: Lines 10‑36 create a realistic node and edge set.  
- **Prompt tests** (lines 38‑77): Verify that `buildLanguageLessonPrompt` includes the node name, summary, target language, relationship context, and requests JSON output.  
- **Response parsing tests** (lines 79‑120): Confirm that `parseLanguageLessonResponse` correctly parses raw JSON, extracts JSON from code blocks, and returns an empty result for invalid input.  
- **Concept detection tests** (lines 122‑156): Ensure `detectLanguageConcepts` identifies async patterns, middleware patterns, and returns an empty array when no concepts are present.

### Impact  
- **Coverage**: Adds unit tests for prompt construction, response parsing, and concept detection, helping catch regressions early.  
- **Maintainability**: Future changes to the analyzer functions will be validated against these tests, reducing silent failures.  
- **Observability**: Test failures will surface missing or incorrect exports, import paths, or configuration changes.  
- **Performance**: Tests are lightweight; no measurable impact on build times.

### Risks & follow‑ups  
- **Import errors**: If `../analyzer/language-lesson.js` or `../languages/configs/typescript.js` do not export the expected symbols, tests will fail.  
- **Snapshot drift**: Prompt formatting changes may require test updates; run tests locally to confirm.  
- **Edge case coverage**: Tests cover typical scenarios but not all edge cases (e.g., large graphs); consider expanding coverage if needed.  
- **Type mismatches**: Ensure `GraphNode` and `GraphEdge` types align with the sample data; mismatches will cause type errors during test compilation.
