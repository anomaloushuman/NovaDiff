### Overview  
A new test file `packages/graph-core/src/__tests__/layer-detector.test.ts` (lines R1‑188) was added to exercise the layer‑detection logic, prompt construction, response parsing, and LLM‑based layer assignment.

### Key changes  
- **Imports** – `vitest` helpers and the four public functions from `../analyzer/layer-detector.js` were added (R1‑R6).  
- **Test helpers** – `makeNode` and `makeGraph` construct minimal `KnowledgeGraph` objects for the tests (R10‑R32).  
- **`detectLayers` tests** – verify detection of “API Layer”, “Data Layer”, and “Core” layers, unique kebab‑case IDs, and that only nodes of type `file` are considered (R36‑R106).  
- **`buildLayerDetectionPrompt` test** – checks that file paths are included and the string “JSON” appears in the prompt (R109‑R119).  
- **`parseLayerDetectionResponse` tests** – cover plain JSON, JSON wrapped in markdown fences, and invalid inputs that should return `null` (R122‑R160).  
- **`applyLLMLayers` test** – ensures LLM‑provided layers are applied correctly and unmatched nodes fall into an “Other” layer (R163‑R188).

### Impact  
- **Coverage** – The tests exercise all stages of the layer‑detection pipeline, reducing the risk of silent regressions.  
- **Maintainability** – Centralized helper functions simplify future test additions.  
- **Observability** – Failures will pinpoint the specific stage (e.g., prompt content or parsing logic) that broke.

### Risks & follow‑ups  
- **Deterministic IDs** – Tests rely on node IDs; changes to ID generation could cause flakiness.  
- **Prompt formatting** – If `buildLayerDetectionPrompt` changes, the test may need updating.  
- **LLM contract** – `applyLLMLayers` assumes a specific layer shape; future LLM responses must match this contract.  
- **Performance** – Running these tests on very large graphs could increase execution time; monitor if graph size grows.
