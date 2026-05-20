### Overview  
A new utility module `packages/graph-view/src/utils/elk-layout.ts` adds ELK‑specific types and two public helpers: `repairElkInput` and `applyElkLayout`. It centralizes input validation, auto‑correction, and layout execution for the graph view.

### Key changes  
- **Imports** added at lines 1‑3: `GraphIssue`, `loadElk`, and `NODE_WIDTH/HEIGHT`.  
- **New interfaces** defined at lines 5‑34, 16‑21, 22‑27, 39‑43, 214‑216, 218‑221.  
- **`repairElkInput`** (lines 56‑213) performs:  
  - Fills missing node dimensions with `DEFAULT_NODE_WIDTH/HEIGHT`.  
  - Deduplicates node IDs per parent.  
  - Removes orphan children and edges.  
  - Detects and strips containment cycles.  
  - Emits `GraphIssue` objects and may throw when `opts.strict` is true.  
- **`applyElkLayout`** (lines 223‑243) loads ELK asynchronously, runs layout on the repaired input, and returns an `ElkLayoutResult`. On failure it returns a minimal positioned graph and a fatal issue unless `opts.strict` is true.

### Impact  
- Guarantees ELK receives well‑formed input, reducing runtime layout errors.  
- The `issues` array provides diagnostics for downstream consumers.  
- Centralizes ELK logic; callers now import a single module instead of scattered helpers.  
- No existing API is altered; the module is additive.

### Risks & follow‑ups  
- `loadElk` must resolve correctly in all environments; a missing bundle could fail silently.  
- `strict` flag behavior: errors propagate only when `opts.strict` is true.  
- Default dimensions (`NODE_WIDTH/HEIGHT`) must stay in sync with the layout module to avoid visual inconsistencies.  
- `applyElkLayout` should handle large graphs without stack overflows during recursive traversal.
