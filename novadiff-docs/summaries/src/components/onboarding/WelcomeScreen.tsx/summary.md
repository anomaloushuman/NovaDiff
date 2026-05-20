### Overview
A new onboarding screen component `WelcomeScreen` has been added to `src/components/onboarding/WelcomeScreen.tsx`. It introduces a full GitHub integration flow with CLI detection, device‑code authentication, and a local‑only fallback.

### Key changes
- **Imports**: React hooks (`useCallback`, `useEffect`, `useState`) and lucide‑react icons (`Copy`, `Download`, `ExternalLink`, `FolderOpen`, `Loader2`, `User`) are added at the top of the file.
- **Props interface** (`WelcomeScreenProps`, lines 5‑10): defines optional `cachedGitUser`, and callbacks `onComplete` and `onLocalOnly`.
- **Component implementation** (`WelcomeScreen`, lines 11‑420):
  - State variables for loading, users, errors, selected user, auth flow, GitHub CLI status, install logs, etc.
  - `useCallback` helpers for `loadGhStatus`, `refresh`, `installGh`, `startAuth`, `copyCode`, `confirmUser`.
  - `useEffect` hooks to load GitHub status, refresh user list, and subscribe to auth/install progress events.
  - Render logic for CLI detection, sign‑in flow, device‑code copy, user list, and a local‑only button.

### Impact
- **API dependencies**: Relies on `window.electronAPI` methods (`githubGhStatus`, `githubDetectedUsers`, `githubGhInstall`, `githubStartAuth`, etc.). Missing or changed APIs will break the component.
- **Performance**: Frequent state updates during auth/install progress may affect rendering; monitor for unnecessary re‑renders.
- **Accessibility & styling**: New UI elements use `aria-hidden` and custom classes; ensure they integrate with existing design system.
- **Testing**: Requires new unit and integration tests for the component and its API interactions.

### Risks & follow‑ups
- **API availability**: Confirm that all `window.electronAPI` methods exist and match the expected signatures.
- **Event listener cleanup**: `useEffect` returns callbacks from `api.onGithubAuthProgress` and `api.onGithubGhInstallProgress`; verify they are unsubscribed on unmount to avoid memory leaks.
- **Error handling**: The component surfaces raw error messages; ensure they are user‑friendly and do not expose sensitive data.
- **UI regressions**: Run visual regression tests to verify that the new onboarding screen does not interfere with existing onboarding flows or layout.
