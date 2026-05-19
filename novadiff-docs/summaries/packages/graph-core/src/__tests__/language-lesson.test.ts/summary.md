### Overview  
A new test file `packages/graph-core/src/__tests__/language-lesson.test.ts` (lines R1‑R157) was added to exercise the language‑lesson analyzer.

### Key changes  
- Imports added at the top of the file (lines 1‑8): `vitest` helpers, `buildLanguageLessonPrompt`, `parseLanguageLessonResponse`, `detectLanguageConcepts` from `../analyzer/language-lesson.js`, type imports for `GraphNode`/`GraphEdge`, and `typescriptConfig` from `../languages/configs/typescript.js`.  
- Sample graph data defined (lines 10‑35): a `sampleNode` (function `verifyToken`) and `sampleEdges` describing `reads_from` and `calls` relationships.  
- Test suites (lines 38‑157) cover:  
  - `buildLanguageLessonPrompt`: verifies inclusion of node name, summary, target language, relationship context, and a request for JSON output.  
  - `parseLanguageLessonResponse`: tests parsing of a plain JSON string, extraction from a fenced code block, and graceful handling of an empty string.  
  - `detectLanguageConcepts`: checks detection of async patterns, middleware patterns, and that no concepts are returned for a plain file node.

### Impact  
- Adds unit coverage for the analyzer utilities, enabling regression detection when prompt formatting or response parsing logic changes.  
- Keeps test data and expectations in a single file, simplifying future updates to the analyzer.

### Risks & follow‑ups  
- **Test flakiness**: JSON parsing must remain deterministic; run tests locally to confirm stability.  
- **Formatting changes**: If prompt generation logic changes, test expectations may need updating (`vitest --update`).  
- **Linting**: Ensure the new file passes the repository’s TypeScript and ESLint checks (`tsc`, `eslint`).  
- **Coverage gaps**: Unknown from the available diff/scan evidence; consider adding more scenarios if coverage is low.
