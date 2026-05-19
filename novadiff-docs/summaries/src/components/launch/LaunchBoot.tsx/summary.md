### Overview
A new component `LaunchBoot` is added at `src/components/launch/LaunchBoot.tsx`. It drives a multi‑step startup UI that animates the logo and text before handing control to the app.

### Key changes
- **Imports** (lines 1‑9): React hooks, `appMark` image, launch constants (`LAUNCH_EXIT_FADE_MS`, `LAUNCH_HOLD_MS`, `LAUNCH_HOLD_SKIP_AFTER_MS`), `usePrefersReducedMotion`, and `TypewriterText`.  
- **Props interface** (lines 13‑16): `LaunchBootProps` with a required `onExitComplete: () => void`.  
- **Component implementation** (lines 17‑216):  
  - State: `step`, `progress`, `canSkip`.  
  - `useEffect` blocks schedule transitions using the constants above and respect the user’s reduced‑motion preference.  
  - A global `keydown` listener allows skipping with “Enter/Space”.  
  - `onExitComplete` is invoked once the exit animation finishes.  
  - The rendered dialog includes the logo, typewriter‑styled text, a progress bar, and a skip overlay.

### Impact
- Adds the image asset `nova-diff-icon.png` and the `TypewriterText` component dependency.  
- Exposes a new callback contract (`onExitComplete`) that callers must provide.  
- Uses `role="dialog"` and `aria-modal="true"` for accessibility.

### Risks & follow‑ups
- **Missing callback**: If `onExitComplete` is not supplied, the component will throw at runtime.  
- **Reduced‑motion path**: Verify that the component skips correctly when `usePrefersReducedMotion` returns true.  
- **Asset resolution**: Confirm that `appMark` resolves in all build environments.  
- **Timer cleanup**: All `useEffect` hooks include cleanup logic, but manual verification is recommended.
