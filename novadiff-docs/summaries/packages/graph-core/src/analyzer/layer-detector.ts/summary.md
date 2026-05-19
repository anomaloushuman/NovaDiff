### Overview  
`packages/graph-core/src/analyzer/layer-detector.ts` adds a lightweight layer detection system and LLM‑driven layer assignment for knowledge graphs. The file introduces new types, heuristics, and helper functions that operate on `KnowledgeGraph` nodes.

### Key changes  
- **Import** (line 1): `import type { KnowledgeGraph, Layer } from "../types.js";`.  
- **LLM response contract** (lines 6‑10): `export interface LLMLayerResponse` defines `name`, `description`, and `filePatterns`.  
- **Heuristic detection**  
  - `LAYER_PATTERNS` (lines 16‑67) maps directory patterns to layer names.  
  - `matchFileToLayer` (lines 80‑97) assigns a file to the first matching pattern.  
  - `detectLayers` (lines 105‑144) builds a `Layer[]` from graph nodes, defaulting unmatched files to a “Core” layer.  
- **LLM prompt & parsing**  
  - `buildLayerDetectionPrompt` (lines 150‑169) generates a prompt listing file paths.  
  - `parseLayerDetectionResponse` (lines 177‑219) extracts and normalizes JSON from LLM output, handling code fences.  
- **LLM‑based layer application** (`applyLLMLayers`, lines 227‑284) assigns file nodes to layers based on `filePatterns`, creating an “Other” layer for unmatched files.

### Impact  
- **Correctness**: Adds deterministic layer assignment; heuristic may misclassify edge cases but defaults to “Core”.  
- **Maintainability**: Centralizes layer logic; future pattern tweaks can be made in `LAYER_PATTERNS`.  
- **Performance**: O(n × m) where *n* is nodes and *m* patterns; acceptable for typical graph sizes.  
- **Compatibility**: No API changes to existing modules; purely additive.  
- **Observability**: New functions can be unit‑tested; LLM prompt generation is deterministic.

### Risks & follow‑ups  
- **LLM output format**: `parseLayerDetectionResponse` expects a JSON array; verify against actual LLM responses.  
- **Pattern coverage**: Missing or overlapping patterns may mislabel files; run integration tests on diverse codebases.  
- **“Other” layer handling**: The layer is created lazily; nodes with no matching pattern are added to “Other”.  
- **Path normalization**: Windows backslashes are replaced, but relative paths may still misalign; validate with mixed‑OS projects.
