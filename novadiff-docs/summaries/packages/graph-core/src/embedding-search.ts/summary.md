### Overview
A new module `packages/graph-core/src/embedding-search.ts` is added.  
It introduces a semantic search engine that operates on graph nodes using pre‑computed vector embeddings.

### Key changes
- **Imports** (lines 1‑2)  
  ```ts
  import type { GraphNode } from "./types.js";
  import type { SearchResult } from "./search.js";
  ```
- **`SemanticSearchOptions` interface** (lines 4‑7)  
  ```ts
  export interface SemanticSearchOptions {
    limit?: number;
    threshold?: number;
    types?: string[];
  }
  ```
- **`cosineSimilarity` function** (lines 14‑29) – computes dot product, magnitudes, returns 0 for zero‑magnitude vectors.
- **`SemanticSearchEngine` class** (lines 37‑83)  
  - Stores `nodes: GraphNode[]` and `embeddings: Map<string, number[]>`.  
  - Methods: `hasEmbeddings`, `addEmbedding`, `updateNodes`.  
  - `search(queryEmbedding, options?)`  
    * Applies optional `types` filter, `threshold` (default 0), and `limit` (default 10).  
    * Computes similarity via `cosineSimilarity`.  
    * Pushes `{ nodeId, score: 1 - similarity }` for matches.  
    * Sorts ascending by `score` (lower = higher similarity) and slices to `limit`.

### Impact
- New public API: `SemanticSearchEngine` and `cosineSimilarity`.  
- Existing code remains unchanged; backward compatibility is preserved.  
- Callers must import the new module and ensure that `SearchResult` matches the `{ nodeId, score }` shape returned by `search`.

### Risks & follow‑ups
- **`SearchResult` type alignment** – the diff shows `SearchResult` imported but its definition is not visible; mismatch could cause type errors.  
- **Default parameters** – `threshold = 0` and `limit = 10` are hard‑coded; verify they meet use cases.  
- **Zero‑magnitude handling** – `cosineSimilarity` returns 0; confirm this behavior is acceptable in all contexts.  
- **Sorting logic** – uses `a.score - b.score`; ensure that lower `score` indeed corresponds to higher similarity as intended.
