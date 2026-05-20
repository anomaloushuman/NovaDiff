### Overview  
A new CommonJS module `electron/workspace-store.cjs` is added to the Electron side of the app. It implements session persistence and workspace CRUD logic using JSON files on disk.

### Key changes  
- **Imports**: added `node:fs`, `node:fs/promises`, `node:path`, and `node:crypto` (lines 3‑6).  
- **Path helpers**: `sessionPath(userData)` and `workspacesRoot(userData)` (lines 8‑14).  
- **I/O helpers**: `readJson(filePath, fallback)` and `writeJson(filePath, data)` (lines 16‑31).  
- **Session API**: `loadSession`, `saveSession`, `setLocalOnlyMode`, `listWorkspaces` (lines 33‑67).  
- **Workspace API**: `upsertWorkspace`, `setActiveWorkspace`, `setGitUser`, `getWorkspace` (lines 74‑106).  
- **State updates**: `updateWorkspaceUiState` and `updateWorkspaceLiveRepo` (lines 108‑145).  
- **Creation flow**: `createWorkspace` generates a UUID, resolves repo paths, creates directories, writes `meta.json`, and updates the session (lines 147‑177).  
- **Exports**: all public functions plus `workspacesRoot` (lines 180‑193).

### Impact  
- **Persistence**: Sessions are stored in `novadiff-session.json` under `userData`; each workspace has a `meta.json` in its own data directory.  
- **API surface**: Callers must import from this module to perform workspace operations.  
- **I/O**: Every operation reads or writes JSON files; concurrent calls may contend on the same files.  
- **Error handling**: `writeJson` uses `rename` for atomic writes, but no file‑locking is implemented.  

### Risks & follow‑ups  
- **Race conditions**: Concurrent `createWorkspace` or `upsertWorkspace` calls could corrupt `novadiff-session.json` (no locking).  
- **Atomicity**: `writeJson` relies on `fs.rename`; verify behavior on all target OSes.  
- **Path validation**: `path.resolve` on an empty string throws; the code throws a custom error if the resolved path is empty (lines 151‑153, 133‑136).  
- **Testing**: Add unit tests for each exported function, especially `createWorkspace` and `updateWorkspaceLiveRepo`.  
- **Lint & build**: Run `npm run lint`, `npm test`, and the production build to catch any syntax or type issues.
