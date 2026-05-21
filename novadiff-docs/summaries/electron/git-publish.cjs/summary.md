### Overview  
`electron/git-publish.cjs` now stages a user‑supplied list of paths instead of always staging the entire repository. The change adds `stagePaths` to the import from `./git-service.cjs` (line 4) and rewrites the staging logic in `executePublish`.

### Key changes  
- **Import update** – `stagePaths` is added to the destructured import from `./git-service.cjs` (line 4).  
- **Conditional staging** – `stageAll(root)` is replaced by logic that builds `stagePathsList` from `opts.stagePaths` (lines 63‑70).  
- **Branching** – If `stagePathsList` is non‑empty, `stagePaths(root, stagePathsList)` runs; otherwise the original `stageAll(root)` is executed.  
- **No other functional changes** – commit, push, and PR creation remain unchanged.

### Impact  
- **Selective staging** – allows committing only specified files, preventing accidental inclusion of unrelated changes.  
- **Maintainability** – staging logic is now isolated; future extensions can modify `stagePaths` without touching `executePublish`.  
- **Performance** – staging fewer files can reduce I/O when `opts.stagePaths` is small.  
- **Compatibility** – callers that omit `stagePaths` continue to stage all files, preserving current behavior.

### Risks & follow‑ups  
- **Missing `stagePaths` export** – verify that `./git-service.cjs` actually exports `stagePaths`; otherwise the import will fail at runtime.  
- **Invalid `opts.stagePaths` values** – if callers pass a non‑array (e.g., a string), the code falls back to `stageAll`, which may be unintended. Add validation or document the expected type.  
- **Ignored paths** – ensure `stagePaths` respects `.gitignore`; otherwise staged files might be ignored by Git, leading to silent failures.  
- **Test coverage** – add unit tests for both branches (with and without `stagePaths`) to confirm behavior and guard against regressions.
