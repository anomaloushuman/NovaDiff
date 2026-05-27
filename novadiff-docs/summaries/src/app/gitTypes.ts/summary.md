### Overview  
The file `src/app/gitTypes.ts` now declares three new exported interfaces: `GitBranchSummary`, `GitBranchListResult`, and `GitLogCommitSummary`. These additions appear at lines 129‑136, 138‑141, and 143‑148 respectively.

### Key changes  
- **`GitBranchSummary`** (lines 129‑136) adds the required property `isRemote: boolean` to the existing branch descriptor (`name`, `hash`, `shortHash`, `upstream`, `isCurrent`).  
- **`GitBranchListResult`** (lines 138‑141) introduces a container type exposing `currentBranch: string` and `branches: GitBranchSummary[]`.  
- **`GitLogCommitSummary`** (lines 143‑148) defines a lightweight commit view with `hash`, `shortHash`, `subject`, and `authoredAt`.  
All three interfaces are exported, expanding the public type surface without removing any existing symbols.

### Impact  
- Code that constructs a `GitBranchSummary` must now provide `isRemote`; otherwise TypeScript will report a missing property.  
- The new interfaces give a consistent shape for branch and commit metadata, which can reduce duplication in the codebase.  
- No existing public APIs are altered; the changes are additive and should not break consumers that rely on the old types.

### Risks & follow‑ups  
- Verify that all branch‑listing functions populate `isRemote`; missing values will cause compile‑time errors.  
- Ensure any serialization/deserialization logic for branch data includes the new `isRemote` field.  
- Check components that render commit summaries to use `GitLogCommitSummary` instead of ad‑hoc shapes.  
- Run the full test suite to confirm that no tests fail due to the new required property.
