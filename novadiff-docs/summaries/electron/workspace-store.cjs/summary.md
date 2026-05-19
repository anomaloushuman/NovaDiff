### Overview  
A new module `electron/workspace-store.cjs` is added to the Electron side of the repository. It implements a session and workspace persistence layer that replaces the previous ad‑hoc storage logic.

### Key changes  
- **Imports** (R3‑R6): `fssync`, `fsp`, `path`, `randomUUID` bring in Node‑core APIs for file I/O and UUID generation.  
- **Path helpers** (R8‑R14): `sessionPath(userData)` and `workspacesRoot(userData)` compute the locations for the session JSON and workspace directories.  
- **JSON I/O** (R16‑R31): `readJson` and `writeJson` use `fsp` to read/write JSON atomically via a temporary file.  
- **Session CRUD** (R33‑R52): `loadSession` loads the session or falls back to defaults; `saveSession` writes it back.  
- **Workspace CRUD** (R74‑R87, R89‑R100, R103‑R106): `upsertWorkspace`, `setActiveWorkspace`, `setGitUser`, `getWorkspace` manipulate the in‑memory session and persist changes.  
- **Live‑repo update** (R108‑R126): `updateWorkspaceLiveRepo` validates the path, updates the workspace, writes `meta.json`, and returns the updated session.  
- **Workspace creation** (R128‑R158): `createWorkspace` generates a UUID, resolves the repo root, creates data directories, writes `meta.json`, updates the session, and returns both objects.  
- **Exports** (R161‑R173): All public functions are exported for use by the renderer and other Electron modules.

### Impact  
- **Atomic writes** via a temporary file (`writeJson` uses `fsp.rename`).  
- **Fallback defaults** in `loadSession` provide a safe initial state.  
- **Non‑blocking I/O** with `fs/promises` and directory creation with `{ recursive: true }`.  
- **Node 18+ requirement** (`node:fs`, `node:crypto`).

### Risks & follow‑ups  
- Verify that `loadSession` correctly handles missing or malformed files (fallback logic).  
- Test concurrent calls to `createWorkspace`/`updateWorkspaceLiveRepo` for race conditions.  
- Ensure `setLocalOnlyMode` clears `gitUser` and `activeWorkspaceId` as intended.  
- Run the full lint, test, and production build pipeline to catch any import or path resolution issues.
