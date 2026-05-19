### Overview  
A new onboarding screen is added at `src/components/onboarding/WelcomeScreen.tsx` (lines 1‑399). It guides users through GitHub CLI detection, installation, and authentication before proceeding to workspace setup.

### Key changes  
- **Component & props** – `WelcomeScreen` implements `WelcomeScreenProps` (R5‑R7) with callbacks `onComplete` (receives a `GitUserProfile`) and `onLocalOnly`.  
- **Imports** – Added React hooks (R1), Lucide icons (R2), and types `GhToolingStatus`, `GitUserProfile` from `../../app/workspaceTypes` (R3).  
- **State & effects** – Uses `useState` for loading, error, auth, device code, installation log, and GitHub status; several `useEffect` hooks keep the UI in sync with `window.electronAPI` (R26‑R64, R76‑R104).  
- **Flows** – Functions `installGh`, `startAuth`, `copyCode`, and `confirmUser` orchestrate CLI installation, OAuth device flow, clipboard handling, and final user confirmation (R106‑R188).  
- **Conditional rendering** – UI sections for CLI detection, installation prompts, auth status, user list, and a local‑only fallback are displayed based on state flags (R193‑R398).

### Impact  
- **Runtime dependency** – All referenced `window.electronAPI` methods (`githubGhStatus`, `githubDetectedUsers`, etc.) must exist; missing methods will throw at runtime.  
- **Parent contract** – Components that render `WelcomeScreen` must provide `onComplete` and `onLocalOnly` handlers.  
- **State updates** – The component performs multiple state updates; re‑renders are expected but not quantified in the diff.  

### Risks & follow‑ups  
- **API availability** – Verify that `window.electronAPI` exposes the required methods; otherwise the component will fail.  
- **Callback contract** – Ensure `onComplete` receives a fully populated `GitUserProfile`; type mismatches could break downstream logic.  
- **Auth flow robustness** – Test device code copy, clipboard fallback, and error handling paths (see `copyCode` implementation).  
- **UI correctness** – Confirm that conditional sections render as intended for different `ghStatus` states and that accessibility attributes are present.
