### Overview  
`packages/graph-core/src/analyzer/tour-generator.ts` adds LLM‑based and heuristic tour generation for a knowledge graph. The file imports `KnowledgeGraph` and `TourStep` (line 1) and exports three functions.

### Key changes  
- **`buildTourGenerationPrompt`** (lines 7‑62): builds a prompt that includes project metadata, node summaries, up to 50 edges, and layer info.  
- **`parseTourGenerationResponse`** (lines 70‑120): extracts JSON from raw or markdown‑wrapped responses, validates required fields, and returns a `TourStep[]`. It returns an empty array on parse failure.  
- **`generateHeuristicTour`** (lines 135‑293): creates a deterministic tour without an LLM. It separates concept nodes, builds adjacency maps, performs Kahn’s topological sort, groups nodes by layers when present, batches unlayered nodes in groups of three, and appends a final “Key Concepts” step. Order numbers are assigned sequentially.

### Impact  
- **API surface**: Consumers can request tours via LLM or fallback to the deterministic heuristic.  
- **Parsing robustness**: `parseTourGenerationResponse` guards against malformed responses, reducing runtime crashes.  
- **Performance**: Topological sort runs in O(V+E); batching keeps step counts manageable for large graphs.  
- **Maintainability**: Clear separation of prompt construction, response parsing, and heuristic logic simplifies future extensions.

### Risks & follow‑ups  
- **LLM prompt size**: The prompt includes all nodes and up to 50 edges; token limits may be exceeded in very large projects (unknown from the diff).  
- **Parsing edge cases**: The function returns an empty array on any parse error; unit tests should cover missing fields or non‑JSON responses (unknown from the diff).  
- **Cycle handling**: Isolated nodes are appended after the topological sort; cycles are not explicitly detected, which could affect ordering (unknown from the diff).  
- **Layer ordering**: The heuristic assumes layers are topologically sorted; verify that layer order aligns with dependency order in real projects (unknown from the diff).
