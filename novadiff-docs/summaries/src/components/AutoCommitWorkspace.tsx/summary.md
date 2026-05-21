### Overview  
`AutoCommitWorkspace.tsx` now exposes a staging‑scope UI, an optional “Review in City” callback, and richer commit‑message context that includes structural classification and knowledge‑graph symbols. The component’s state and UI have been extended accordingly.

### Key changes  
- **Imports** – `classifyCompareRows` and `graphSymbolsContext` added (R6‑7).  
- **Props** – `onReviewInCity?: (paths: string[]) => void` added to `AutoCommitWorkspaceProps` (R23).  
- **State** – `stageSelection` (`Set<string>`) and `stageAllFiles` (`boolean`) introduced (R55‑56).  
- **UI** –  
  - Staging‑scope panel with a “Stage all changed files” checkbox and per‑file checkboxes (R298‑355).  
  - “Review in City” button that calls `onReviewInCity` with the selected paths (R339‑353).  
  - Docs note area shows the generated documentation bundle path (R129‑138).  
- **Logic** –  
  - `generateDraft` builds `classification` via `classifyCompareRows` and `graphContext` via `graphSymbolsContext` (R110‑127).  
  - `executePublish` accepts an optional `stagePaths` array derived from `stageSelection`/`stageAllFiles` (R193‑194).  
  - Commit‑message context (`buildCommitMessageContext`) now receives `{ classification, graphContext }` (R135).  

### Impact  
- **Correctness** – Commit messages now incorporate file classification and graph symbols, improving semantic accuracy.  
- **Maintainability** – New props and state are typed; UI logic is modularized into separate panels.  
- **Performance** – Additional state updates and context calculations add minor overhead only when staging or publishing.  
- **Compatibility** – Existing consumers may ignore `onReviewInCity`; it is optional.  

### Risks & follow‑ups  
- **Regression** – Verify that `stageSelection` persists correctly across repo refreshes.  
- **API contract** – `api.readKnowledgeGraph` and `api.writeNovadiffDocs` must be available; otherwise the component should fail gracefully.  
- **UI layout** – The added staging panel may affect responsive design; run visual regression tests.  
- **Prop usage** – Ensure that spreading `AutoCommitWorkspaceProps` does not unintentionally pass `onReviewInCity`.
