### Overview  
A new module `packages/graph-core/src/staleness.ts` (lines 1‑90) adds utilities for detecting stale knowledge graphs and merging incremental updates.

### Key changes  
- **Imports** (`R1‑R2`): `execFileSync` from `child_process` and type definitions from `./types.js`.  
- **`StalenessResult` interface** (`R4‑R7`): exposes `stale: boolean` and `changedFiles: string[]`.  
- **`getChangedFiles`** (`R13‑R28`): runs `git diff <lastCommitHash>..HEAD --name-only` in `projectDir`; returns trimmed file paths or an empty array on error.  
- **`isStale`** (`R34‑R42`): calls `getChangedFiles` and reports `stale` if any files changed.  
- **`mergeGraphUpdate`** (`R54‑R90`):  
  1. Builds a set of changed file paths (`changedSet`).  
  2. Removes nodes whose `filePath` matches a changed file (`removedNodeIds`).  
  3. Keeps edges whose source and target are not in `removedNodeIds`.  
  4. Returns a new graph with updated `project.gitCommitHash` and `project.analyzedAt`, and appends `newNodes`/`newEdges`.

### Impact  
- **Correctness**: Provides deterministic staleness checks and a clear merge strategy for incremental graph updates.  
- **Maintainability**: Centralizes git‑based change detection; future extensions can reuse `getChangedFiles`.  
- **Performance**: `execFileSync` blocks the event loop; suitable for CLI tooling but may need async refactor for high‑throughput services.  
- **Compatibility**: Relies on a Git repository; non‑Git environments will silently return an empty change list.

### Risks & follow‑ups  
- **Error handling**: `getChangedFiles` swallows all errors; verify that silent failures are acceptable or add logging.  
- **Node removal logic**: Assumes `filePath` is defined on nodes; test with nodes lacking this property to ensure no unintended removals.  
- **Edge filtering**: Only checks source/target IDs; confirm that edges referencing removed nodes are correctly pruned.  
- **Timestamp precision**: `new Date().toISOString()` may not match existing format; run integration tests to confirm consistency.
