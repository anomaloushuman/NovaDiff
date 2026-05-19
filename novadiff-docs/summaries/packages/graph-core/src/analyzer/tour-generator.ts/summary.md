### Overview  
A new file `packages/graph-core/src/analyzer/tour-generator.ts` adds a lightweight tour‑generation system. It exports three functions and imports the `KnowledgeGraph` and `TourStep` types from `../types.js` (line 1). The functions are:

- `buildTourGenerationPrompt` (lines 7‑62) – builds an LLM prompt that includes project metadata, node and edge lists, and layer information, and specifies a JSON response format.  
- `parseTourGenerationResponse` (lines 70‑120) – extracts JSON from raw or fenced text, validates required fields, and returns an array of `TourStep`.  
- `generateHeuristicTour` (lines 135‑293) – heuristically builds a tour using Kahn’s topological sort, groups nodes by layers when present, batches code nodes into steps, and appends a final “Key Concepts” step for concept nodes.

### Key changes  
- Import added: `KnowledgeGraph, TourStep` (line 1).  
- Prompt construction, parsing, and heuristic generation functions added (lines 7‑62, 70‑120, 135‑293).  
- Documentation comments added for each function.  
- Topological sort handles isolated nodes and cycles by appending them after the main pass (lines 181‑186).  
- Concept nodes are always appended last (lines 274‑285).

### Impact  
- **Algorithmic**: Uses Kahn’s algorithm (O(V+E)) for ordering code nodes.  
- **Structure**: Centralizes prompt logic and parsing, reducing duplication.  
- **Extensibility**: New functions are additive; existing exports remain unchanged.

### Risks & follow‑ups  
- `parseTourGenerationResponse` silently returns an empty array on any parsing error (lines 117‑119); downstream code should handle empty tours.  
- Layer ordering is derived from the topological sort; no evidence that layer dependencies are fully respected.  
- Concept nodes are appended after all code nodes; if a concept node depends on code, the current ordering may mislead users.  
- Prompt size grows with graph size; no evidence on token limits from the diff.
