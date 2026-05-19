### Overview  
A new test file `packages/graph-core/src/analyzer/llm-analyzer.test.ts` has been added. It imports the Vitest helpers (`describe`, `it`, `expect`) and the four LLM‑analyzer utilities from `./llm-analyzer.js`. The file contains unit tests for prompt construction and JSON response parsing.

### Key changes  
- **Imports added** (lines R1‑R7):  
  ```ts
  import { describe, it, expect } from "vitest";
  import {
    buildFileAnalysisPrompt,
    buildProjectSummaryPrompt,
    parseFileAnalysisResponse,
    parseProjectSummaryResponse,
  } from "./llm-analyzer.js";
  ```
- **Prompt‑generation tests** (lines 9‑34, 158‑179):  
  - `buildFileAnalysisPrompt` is verified to embed file path, content, project context, and JSON schema markers.  
  - `buildProjectSummaryPrompt` checks that a file list and optional sample contents are included correctly.
- **Response‑parsing tests** (lines 36‑156, 182‑247):  
  - `parseFileAnalysisResponse` is exercised against valid JSON, markdown‑wrapped JSON, missing fields, invalid inputs, and default handling for `complexity`.  
  - `parseProjectSummaryResponse` tests valid JSON, markdown fences, missing fields, and invalid JSON.

### Impact  
- Provides confidence that prompt construction and JSON parsing behave as intended, catching regressions early.  
- No snapshots are used; failures will surface detailed assertion messages.

### Risks & follow‑ups  
- Tests are brittle to changes in the prompt format; review the prompt specification before refactoring.  
- The current suite does not cover nested markdown or non‑JSON responses; consider adding such cases if the LLM output format evolves.  
- Verify that `npm run lint`, `npm test`, and `npm run build` succeed after adding this file.
