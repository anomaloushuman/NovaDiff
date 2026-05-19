### Overview  
A new file `src/app/workspaceStorage.ts` (R1‑R112) introduces local‑storage helpers for Git user data, active workspace ID, and a local‑only mode flag. It also defines the `OnboardingGate` type and provides utilities for resolving the onboarding step, merging session state, and finding a workspace by ID.

### Key changes  
- **Imports**: `GitUserProfile`, `NovaWorkspace`, `WorkspaceSessionState` from `./workspaceTypes` (R1).  
- **Constants**: `USER_KEY`, `ACTIVE_WS_KEY`, `LOCAL_ONLY_KEY` (R3‑R5).  
- **Git user helpers**: `loadCachedGitUser`, `saveCachedGitUser`, `clearCachedGitUser` (R7‑R25).  
- **Active workspace helpers**: `loadCachedActiveWorkspaceId`, `saveCachedActiveWorkspaceId` (R27‑R41).  
- **Local‑only mode helpers**: `loadCachedLocalOnly`, `saveCachedLocalOnly` (R45‑R63).  
- **Onboarding**: `OnboardingGate` type and `resolveOnboardingGate` (R43‑R86).  
- **Session utilities**: `mergeSession` (R88‑R102).  
- **Workspace lookup**: `findWorkspace` (R104‑R112).

### Impact  
- **API surface**: Exposes a clear set of functions for caching and session handling; no existing modules are altered.  
- **Error handling**: All storage accesses are wrapped in `try/catch` blocks that return safe defaults (e.g., `null` or `false`).  
- **Performance**: Operations are synchronous and lightweight; localStorage is accessed only when needed.

### Risks & follow‑ups  
- **Silent failures**: Catch blocks swallow errors; consider logging in development to surface storage issues.  
- **Type alignment**: Verify that `GitUserProfile` and `WorkspaceSessionState` match the JSON structures stored; run TypeScript checks.  
- **Onboarding logic**: Ensure `resolveOnboardingGate` prioritizes flags (`skipBoot`, `localOnlyMode`, `hasUser`, `hasActiveWorkspace`) as intended; unit tests are recommended.  
- **Testing coverage**: Add tests for each helper to confirm correct serialization, error handling, and merge behavior.
