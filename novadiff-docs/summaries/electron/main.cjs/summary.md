### Overview
A new `electron/main.cjs` file replaces the previous main‑process entry point. It imports Node modules, sets up the Electron app, defines window helpers, and registers a comprehensive IPC surface.

### Key changes
- **Imports** added at lines 1‑16: `fs/promises`, `fs`, `path`, `url`, `electron`, `compare-runner.cjs`, `llm.cjs`, `prefetch-summaries.cjs`, etc. (`R1‑16`).
- **Window helpers**:  
  - `createWindow` (lines 164‑203) creates the main window.  
  - `buildMenu` (144‑162) builds the application menu.  
  - `iconPath` (136‑142) resolves the app icon.  
  - `windowStatePayload` (118‑123) and `emitWindowState` (129‑133) report window state.
- **Progress emitters**:  
  - `sendEngineProgress` (18‑22)  
  - `sendKnowledgeGraphProgress` (571‑587)  
  - `sendWorkspaceHistoryProgress` (806‑812)  
  - `sendGithubAuthProgress` (838‑844)
- **IPC surface**: hundreds of `ipcMain.handle` registrations covering:  
  - Compare operations (`compare-folders`, `get-file-diff`, `filter-changes-gitignore`, etc.) – lines 222‑457.  
  - LLM actions (`llm-summarize`, `llm-summarize-stream`, `llm-abort-stream`, `llm-probe`) – lines 306‑335.  
  - Knowledge‑graph build/read – lines 589‑611.  
  - Docs handling (`write-novadiff-docs`, `read-novadiff-docs-file`, `open-novadiff-docs-in-browser`) – lines 500‑570.  
  - Git/GitHub integration (`git-detect-tooling`, `git-repo-status`, `github-list-repos`, `github-pr-compare-roots`, `github-gh-install`, etc.) – lines 694‑852.  
  - Workspace management (`workspace-create`, `workspace-set-active`, `workspace-list`, `workspace-update-live-repo`, `workspace-ensure-commit-snapshot`, etc.) – lines 898‑1069.  
  - Snapshot operations (`workspace-snapshot-list-files`, `workspace-snapshot-read-file`) – lines 1027‑1056.
- **Lifecycle hooks**: `app.whenReady` (205‑208), `activate` (209‑213), `window-all-closed` (216‑220), and `before-quit` (1088‑1090) which calls `cleanupNovadiffWorktrees`.

### Impact
- IPC channel names are explicit; duplicate names would override earlier handlers (risk: collision).  
- Path validation in `read-novadiff-docs-file` (521‑549) and `knowledge-graph-read-file` (646‑660) mitigates traversal attacks.  
- Git clone and GH install use `child_process.spawn` with sanitized arguments; injection remains a risk if inputs are not validated.  
- Node 18+ `node:` imports require compatible Electron; older builds may fail.  
- Progress emitters provide telemetry but need matching listeners to avoid memory leaks.

### Risks & follow‑ups
1. Verify renderer code does not reuse IPC channel names such as `compare-folders` or `llm-summarize`.  
2. Test edge cases for path validation in docs and graph read handlers.  
3. Ensure inputs to `spawn` (git clone, gh install) are sanitized to prevent command injection.  
4. Confirm that `nova-diff-icon.png` is bundled for packaged builds.
