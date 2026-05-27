### Overview  
`electron/workspace-history.cjs` now imports two additional helpers from `git-service.cjs` (`listBranches`, `listCommitsForRef`) and introduces a new function, `materializeCommitForCompare`. This helper resolves a Git ref or hash to a snapshot path, creating the snapshot if it does not already exist. The module’s export list is updated to expose the new function and the two imported helpers.

### Key changes  
- **Import expansion** – line 6 now pulls `listBranches` and `listCommitsForRef` from `git-service.cjs`.  
- **New function** – `materializeCommitForCompare` (lines 295‑314) resolves a ref or hash, checks for an existing usable snapshot, and if missing, creates one via `snapshotCommit`.  
- **Export list update** – lines 316‑324 add `listBranches`, `listCommitsForRef`, and `materializeCommitForCompare` to `module.exports`.

### Impact  
- Other modules can now call `materializeCommitForCompare` to obtain a snapshot path for any commit or branch reference, simplifying comparison workflows.  
- The added imports make `listBranches` and `listCommitsForRef` available for use within this file or exported for external use.

### Risks & follow‑ups  
- **Missing helper definitions** – Ensure `git-service.cjs` actually exports `listBranches` and `listCommitsForRef`; otherwise imports will fail at runtime.  
- **Error handling** – `materializeCommitForCompare` throws if the workspace is missing or the ref is empty; callers must handle these errors.  
- **Snapshot creation side‑effects** – The function creates a snapshot directory if absent; verify that this behavior aligns with the intended workflow and that no unintended snapshots are produced.  
- **Testing** – Add unit tests covering the new function’s success and failure paths, and confirm that the export list reflects the changes.
