### Overview  
The workspace store now serializes session writes, uses atomic file writes, and simplifies the `upsertWorkspace` flow. The public API remains unchanged.

### Key changes  
- **Session write queue** – a global `sessionWriteChain` (L25‑32) and `withSessionWriteLock(task)` (L27‑31) serialize updates to the session file.  
- **Atomic writes** – `writeJsonAtomic` (L33‑63) writes to a temporary file, renames it, and falls back to `copyFile` on rename errors (lines 47‑50, 55‑58).  
- **`writeJson`** now delegates to `writeJsonAtomic` (L64‑67).  
- **`saveSession`** wraps its write in the lock (L101‑102).  
- **`upsertWorkspace`** signature changed to `upsertWorkspace(userData, workspace, opts = {})` (L110‑111). It writes the workspace meta first (`writeJson(path.join(workspace.dataDir, "meta.json"), workspace)` – L112‑113), then updates the session inside the lock (L116‑129). The old implementation (L74‑86) was removed.  
- **Error handling** – `writeJsonAtomic` now checks `fssync.existsSync(tmp)` before attempting `copyFile` and `unlink` (lines 47‑50).  

### Impact  
- **Correctness** – atomic writes and the write lock prevent partial or corrupted session files, especially under concurrent operations.  
- **Maintainability** – centralizing write logic reduces duplication and clarifies persistence flow.  
- **Compatibility** – exported API unchanged; callers use the same functions.  

### Risks & follow‑ups  
- Verify that `withSessionWriteLock` propagates rejections and that `sessionWriteChain` resets after a failure.  
- Run concurrent stress tests on `saveSession` and `upsertWorkspace` to ensure no data loss.  
- Confirm the rename‑fallback logic works on Windows and other filesystems where `rename` may fail.  
- Ensure `writeJsonAtomic` still appends a newline (`\n`) to JSON files, preserving the original formatting.
