### Overview  
A new file `src/components/AutoCommitWorkspace.tsx` (lines 1‑387) introduces a React component that combines Git status, LLM‑generated commit messages, optional documentation bundles, and GitHub PR creation into a single UI.

### Key changes  
- **Imports** (lines 1‑9): React hooks, Lucide icons, and app modules (`commitMessage`, `docWorkspaceMetrics`, `llmStorage`, `types`, `gitTypes`).  
- **Props interface** `AutoCommitWorkspaceProps` (lines 12‑21) declares `suggestedRepoPath`, `compared`, `compareRows`, `leftRoot`, `rightRoot`, `leftTitle`, `rightTitle`, and `llmSettings`.  
- **Component** `AutoCommitWorkspace` (lines 25‑381) manages state for repo root, Git status, preview, draft generation, publishing, and UI step (`draft`, `review`, `done`). It uses `window.electronAPI` methods:  
  - `refreshRepo` calls `api.gitRepoStatus` (line 67) and `api.gitPublishPreview` (line 70).  
  - `generateDraft` calls `api.llmSummarize` (line 112) and optionally `api.writeNovadiffDocs` (line 129).  
  - `executePublish` calls `api.gitPublishExecute` (line 168).  
- **Helper** `pathBasename` (lines 383‑387) extracts the last segment of a path for labeling.

### Impact  
- Adds runtime dependencies on `window.electronAPI`; missing any of the referenced APIs will surface as runtime errors.  
- Heavy work (LLM summarization, metric calculation) runs inside callbacks; if these operations block the event loop, the UI may freeze until completion.

### Risks & follow‑ups  
1. **API availability** – Verify that `gitRepoStatus`, `gitPublishPreview`, `llmSummarize`, `writeNovadiffDocs`, and `gitPublishExecute` exist on `window.electronAPI`.  
2. **Type mismatches** – Ensure `GitRepoStatus`, `PublishPreview`, and `FileChange` types match the actual API responses.  
3. **LLM failure** – `parseCommitMessageOutput` (imported from `commitMessage`) may throw; confirm graceful error handling.  
4. **UI blocking** – Monitor for freezes during draft generation; consider adding a spinner or off‑loading heavy work.
