### Overview  
A new file `packages/graph-core/src/analyzer/layer-detector.ts` adds lightweight layer detection and LLM‑based inference utilities.  
The module imports core types (`KnowledgeGraph`, `Layer`) from `../types.js` (line 1) and exports several helpers.

### Key changes  
- **Interface** `LLMLayerResponse` (lines 6‑10) defines the LLM‑returned layer shape.  
- **Pattern table** `LAYER_PATTERNS` (lines 16‑67) lists directory‑pattern → layer mappings.  
- **Helper** `toLayerId` (lines 72‑74) normalises a layer name to a kebab‑case ID.  
- **File‑to‑layer matcher** `matchFileToLayer` (lines 80‑97) checks path segments against `LAYER_PATTERNS`.  
- **Heuristic detector** `detectLayers` (lines 105‑144) walks the graph, assigns file nodes to layers via `matchFileToLayer`, and creates a “Core” layer for unmatched files.  
- **Prompt builder** `buildLayerDetectionPrompt` (lines 150‑169) lists all file paths for an LLM prompt.  
- **Response parser** `parseLayerDetectionResponse` (lines 177‑217) extracts JSON from raw or fenced responses, validates entries, and returns an array of `LLMLayerResponse`.  
- **LLM application** `applyLLMLayers` (lines 227‑284) maps file nodes to LLM‑defined layers using `filePatterns`; unmatched files go to an “Other” layer.

### Impact  
- Adds deterministic layer assignment logic and LLM integration without altering existing APIs.  
- All operations run in linear time over graph nodes; no new I/O or recursion.  
- Centralises layer logic in a single module, simplifying reuse across services.

### Risks & follow‑ups  
- `matchFileToLayer` may misclassify files when directory names overlap; test against edge‑case paths.  
- `parseLayerDetectionResponse` assumes a JSON array; validate with varied LLM outputs (code fences, plain text).  
- `applyLLMLayers` lazily creates an “Other” layer; ensure consumers handle missing layers.  
- Path normalization replaces backslashes but does not resolve relative segments (`..`); run integration tests on mixed OS environments.
