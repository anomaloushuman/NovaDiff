### Overview  
A new React component, **`AutoCommitWorkspace`**, is added to `src/components/AutoCommitWorkspace.tsx`. It renders a UI that lets a user generate an AI‑summarized commit message, review it, and optionally publish the commit and open a pull request. The component relies on Electron APIs exposed via `window.electronAPI` and an LLM summarizer.

### Key changes  
- **Imports** (lines 1‑9): added React hooks, Lucide icons, and types/functions from `commitMessage`, `docWorkspaceMetrics`, `llmStorage`, and `types`.  
- **Props interface** (`AutoCommitWorkspaceProps`, lines 12‑21): defines `suggestedRepoPath`, `compared`, `compareRows`, root paths, titles, and `llmSettings`.  
- **Component implementation** (`AutoCommitWorkspace`, lines 25‑381):  
  - State for repo status, preview, draft content, loading flags, and UI step.  
  - Callbacks: `refreshRepo`, `generateDraft`, `executePublish`, and `browseRepo`.  
  - Uses `window.electronAPI` for git status, publish preview, LLM summarization, and publish execution.  
  - Renders sections for repository status, draft generation, review, and publish, with conditional UI based on `step`.  
- **Helper function** `pathBasename` (lines 383‑387) extracts the repo name from a path.  
- **UI elements**: Buttons, inputs, and icons (`Upload`, `Check`, `GitBranch`, `Loader2`) tied to the new state logic.

### Impact  
- Adds an end‑to‑end auto‑commit workflow; bundle size grows slightly due to new imports.  
- Requires the Electron API surface (`gitRepoStatus`, `gitPublishPreview`, `llmSummarize`, `gitPublishExecute`, `writeNovadiffDocs`, `pickDirectory`) to be present; missing methods will cause runtime errors.  
- `buildDocWorkspaceMetrics` runs on every `compareRows` change; large diffs may affect responsiveness.  
- New CSS classes (`git-workspace`, `doc-workspace-panel`, etc.) must exist for proper layout.

### Risks & follow‑ups  
- **API availability**: Verify that `window.electronAPI` exposes all required methods; otherwise the component will fail at runtime.  
- **Type consistency**: Ensure imported types (`LlmSettings`, `FileChange`, `GitRepoStatus`, `PublishPreview`) match the actual API contracts.  
- **Metric computation**: Benchmark `buildDocWorkspaceMetrics` for large `compareRows` to confirm acceptable performance.  
- **UI correctness**: Test conditional rendering for each `step` value and confirm that the UI behaves correctly on various screen sizes.
