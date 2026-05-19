### Overview  
The `electron/preload.cjs` script now exposes additional IPC‑bound APIs for knowledge‑graph handling, engine progress, and extended Git/GitHub integration. No existing APIs were removed; the new functions are appended after the existing `onSummaryPrefetchProgress` block (see lines 51‑72 and 118‑178).

### Key changes  
- **Knowledge‑graph API** (lines 51‑72):  
  - `buildKnowledgeGraph`, `readKnowledgeGraph`, `readKnowledgeGraphFile` invoke `"knowledge-graph-build"`, `"knowledge-graph-read"`, `"knowledge-graph-read-file"`.  
  - `onKnowledgeGraphProgress` registers a listener on `"knowledge-graph-progress"` and returns a cleanup function.  
- **Engine progress** (lines 64‑71): similar pattern for `"engine-progress"`.  
- **Git tooling** (lines 118‑127): new helpers (`gitDetectTooling`, `gitRepoStatus`, `gitDiscoverRepos`, etc.) expose `"git-detect-tooling"`, `"git-repo-status"`, etc.  
- **GitHub integration** (lines 147‑168): progress listeners for `"github-gh-install-progress"` and `"github-auth-progress"`.  
- **Workspace history** (lines 170‑177): `onWorkspaceHistoryProgress` listens on `"workspace-history-progress"`.

### Impact  
- **Runtime correctness**: Each new IPC channel requires a corresponding main‑process handler; missing handlers will trigger runtime errors.  
- **Memory safety**: Every event listener returns a cleanup function; callers must invoke it to avoid leaks.  
- **Surface area**: The API surface expands, so documentation and type definitions should be updated.  
- **Performance**: Additional listeners add minimal IPC overhead; the impact is negligible for typical usage.

### Risks & follow‑ups  
1. **Missing main‑process handlers** – Verify that handlers for `"knowledge-graph-build"`, `"git-detect-tooling"`, etc., exist.  
2. **Listener leaks** – Ensure cleanup functions are called when components unmount.  
3. **Name collisions** – Confirm that new symbols (`onEngineProgress`, `onWorkspaceHistoryProgress`) do not shadow legacy ones.  
4. **Test coverage** – Add unit tests for the new preload functions to guard against IPC regressions.
