### Overview  
A new file `packages/graph-core/src/embedding-search.ts` adds a lightweight semantic search engine that operates on pre‑computed vector embeddings of graph nodes.

### Key changes  
- **Imports** – `GraphNode` from `./types.js` and `SearchResult` from `./search.js` (lines 1‑2).  
- **`SemanticSearchOptions`** (lines 4‑7) introduces optional `limit`, `threshold`, and `types`.  
- **`cosineSimilarity`** (lines 14‑30) computes dot product and magnitudes, returning `0` when either vector has zero magnitude.  
- **`SemanticSearchEngine`** (lines 37‑83) stores nodes and embeddings, and exposes `hasEmbeddings`, `addEmbedding`, `search`, and `updateNodes`.  
- **Search logic** (lines 54‑78) filters by node type, applies a similarity threshold, scores as `1 – similarity`, sorts ascending, and slices to the requested limit.

### Impact  
- Deterministic similarity scoring; zero‑magnitude vectors return `0`, avoiding NaNs.  
- Encapsulates search logic in a single class; the options interface centralizes configuration.  
- Performs a linear scan over all nodes; suitable for small graphs but may need optimization for larger datasets.  
- No changes to existing public APIs; the new module is isolated.

### Risks & follow‑ups  
- No unit tests cover the new engine; run `npm test` to confirm no accidental breakage.  
- Linear search could become a bottleneck; benchmark against the current search implementation.  
- Embedding keys must match `node.id`; mismatches will silently skip nodes.  
- Build verification: run `npm run build` to confirm the new file is included.
