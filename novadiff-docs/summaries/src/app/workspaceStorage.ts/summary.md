### Overview  
`src/app/workspaceStorage.ts` is a new module that centralises local‑storage access for Git user data, active workspace ID, and a local‑only flag. It also supplies utilities for onboarding gate resolution, session merging, and workspace lookup.

### Key changes  
* **Imports & constants** – added at line 1:  
  ```ts
  import type { GitUserProfile, NovaWorkspace, WorkspaceSessionState } from "./workspaceTypes";
  const USER_KEY = "novadiff_git_user_v1";
  const ACTIVE_WS_KEY = "novadiff_active_workspace_v1";
  const LOCAL_ONLY_KEY = "novadiff_local_only_v1";
  ```
* **Caching helpers** – functions at lines 7‑16, 19‑25, 27‑32, 35‑41, 45‑50, 53‑62 provide safe `get`, `set`, and `remove` operations for the three keys.  
* **Onboarding gate** – `export type OnboardingGate = "boot" | "welcome" | "hub" | "app"` (line 43) and `resolveOnboardingGate(opts)` (lines 65‑94) decide the next UI step based on flags such as `skipBoot`, `localOnlyMode`, and confirmation flags.  
* **Session merging** – `mergeSession(partial, current)` (lines 95‑109) returns a new `WorkspaceSessionState` by overriding only supplied fields.  
* **Workspace lookup** – `findWorkspace(workspaces, id)` (lines 111‑119) returns the matching `NovaWorkspace` or `null`.

### Impact  
* **Persistence** – state is now stored in `localStorage`; code that previously held state in memory must use these helpers.  
* **Error handling** – each load function catches errors and returns a safe default, preventing crashes when `localStorage` is unavailable.  
* **Onboarding flow** – gate logic is now a single, testable function, simplifying UI decision making.  
* **Session consistency** – `mergeSession` preserves untouched fields, reducing accidental data loss.  
* **Compatibility** – the module only adds exports; existing imports remain valid.

### Risks & follow‑ups  
* **LocalStorage availability** – verify that the runtime defines `localStorage` (e.g., SSR or private mode).  
* **Data format changes** – ensure `GitUserProfile` and `WorkspaceSessionState` serialisations remain compatible; otherwise `JSON.parse` may fail.  
* **Onboarding logic correctness** – run integration tests for all gate combinations (`boot`, `welcome`, `hub`, `app`).  
* **Duplicate keys** – confirm that `novadiff_git_user_v1`, `novadiff_active_workspace_v1`, and `novadiff_local_only_v1` do not clash with other modules.
