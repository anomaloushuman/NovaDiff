### Overview  
A new component `src/components/launch/AppLaunchShell.tsx` is added to orchestrate the app launch sequence, providing a context, handling reduced‑motion preferences, and managing phase transitions.

### Key changes  
- **Imports**: Adds React hooks (`useCallback`, `useEffect`, `useMemo`, `useState`) and launch‑sequence utilities (`LAUNCH_REVEAL_MS`, `type LaunchPhase`, `markLaunchComplete`, `readLaunchSkipped`) plus `usePrefersReducedMotion`, `LaunchProvider`, `LaunchBoot`, and `launch.css`.  
- **Props interface** (`AppLaunchShellProps`, lines 13‑18): optional `chrome`, required `children`, optional `onPhaseChange`.  
- **Component logic** (`AppLaunchShell`, lines 19‑76):  
  - Determines `skipSequence` via reduced‑motion flag or persisted skip.  
  - Manages `phase` (`boot`, `reveal`, `ready`) and `bootVisible` state.  
  - Calls `markLaunchComplete` on boot exit and triggers `onPhaseChange`.  
  - Provides context (`phase`, `skipSequence`, `brandReveal`) to descendants.  
  - Computes motion‑related CSS classes and renders `LaunchBoot`, optional chrome panel, and children.

### Impact  
- **Behavior**: Introduces a controlled launch flow that can skip the boot sequence if reduced motion is preferred or previously skipped.  
- **UI**: Adds CSS classes (`is-launched`, `is-revealing`, `is-ready`) that affect visual transitions.  
- **API**: Exposes `onPhaseChange` callback for external observers to react to phase changes.  
- **Performance**: Adds a timeout (`LAUNCH_REVEAL_MS`) and state updates; negligible overhead but must be verified under heavy load.  
- **Compatibility**: Requires `LaunchBoot` and `LaunchContext` to exist; missing imports will break the build.

### Risks & follow‑ups  
- **Missing CSS**: Ensure `launch.css` defines the expected classes; otherwise transitions will be broken.  
- **Reduced‑motion handling**: Verify that `usePrefersReducedMotion` correctly propagates and that `readLaunchSkipped` persists state across sessions.  
- **Phase callback**: Test that `onPhaseChange` is invoked exactly once per phase transition and that consumers handle it safely.  
- **Context consumption**: Confirm that child components consume `LaunchProvider` correctly; otherwise they may receive undefined context values.
