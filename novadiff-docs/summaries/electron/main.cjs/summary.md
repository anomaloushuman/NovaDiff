### Overview
The `electron/main.cjs` module has been refactored to replace synchronous engine calls with asynchronous ones, add progress reporting via IPC, and remove legacy handlers. The changes introduce new imports, helper functions, and async IPC handlers for knowledge‑graph and workspace operations.

### Key changes
- **Imports**  
  - Added `const fssync = require("node:fs");` (R4).  
  - Replaced legacy `runCompareEngine` with `runCompareEngine, runCompareEngineAsync` (R16).  
  - Added `buildKnowledgeGraph` (R43), `git-service` (R51), and `github-service` (R59).  
- **Progress helpers**  
  - `sendEngineProgress(webContents, payload)` (R18‑R20).  
  - `sendKnowledgeGraphProgress` and `sendWorkspaceHistoryProgress` emit progress events.  
- **Async IPC handlers**  
  - New handlers for knowledge‑graph build/read, git tooling detection, repo status, publish preview/execute, and docs read/open, all wired to the new progress callbacks.  
- **Legacy removal**  
  - Removed handlers such as `filter-changes-gitignore`, `codebase-outline`, and `risk-signals`.  
- **Window creation**  
  - Updated `createWindow` logic (ranges 110‑511 and 159‑565) to accommodate the new async flow.

### Impact
- Enables non‑blocking UI during heavy engine operations.  
- Provides real‑time progress updates to renderer processes.  
- Simplifies codebase by eliminating outdated handlers.  
- Requires updated IPC listeners in the renderer to consume new events.

### Risks & follow‑ups
- **Compatibility**: Ensure all renderer IPC listeners are updated to handle the new progress events.  
- **Testing**: Run lint, unit tests, and production build (`npm run lint`, `npm test`, `npm run build`) to confirm no regressions.  
- **File system checks**: Verify `fssync` usage correctly handles synchronous file reads without blocking the main thread.  
- **Deprecation**: Confirm that removed legacy handlers are no longer referenced elsewhere in the project.
