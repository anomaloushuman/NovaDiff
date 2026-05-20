### Overview
A new `src/vite-env.d.ts` file (added at line 1) declares TypeScript typings for the Electron API and several payload interfaces used across the project.

### Key changes
- **Imports** – type definitions are pulled from `./app/types`, `./app/llmStorage`, and `./app/gitTypes` (diff lines 3‑16).  
- **Payload interfaces** – added `SummaryPrefetchPayload`, `FileSummaryExportPayload`, `FileSummaryMarkdownReadPayload`, `SelectionSummaryExportPayload`, `SelectionSummaryMarkdownReadPayload`, `NovadiffDocsWritePayload`, and `NovadiffDocsReadPayload` (lines 33‑104).  
- **ElectronAPI interface** – declares a comprehensive set of methods for folder comparison, file diffing, window control, summary prefetching, artifact persistence, codebase scanning, LLM interactions, Git tooling, workspace management, and more (lines 104‑383).  
- **Global augmentation** – extends `Window` with an optional `electronAPI` property (lines 385‑388).  
- **Module export** – exports an empty object to satisfy module resolution (line 391).

### Impact
- **Type safety** – compile‑time checks and IDE autocompletion for all Electron API calls are now available.  
- **Consistency** – payload shapes are centralized, reducing duplication.  
- **Consumer updates** – modules that use `electronAPI` must import the new types and adjust method calls to match the declared signatures.

### Risks & follow‑ups
- **Signature mismatches** – verify that the runtime Electron implementation matches the declared `ElectronAPI` methods; mismatches will surface at runtime.  
- **Global conflicts** – ensure no other global declarations clash with the added `Window` augmentation.  
- **Testing** – run the full test suite and the TypeScript compiler to confirm no new type errors or runtime failures.
