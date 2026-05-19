### Overview  
A new `LaunchContext` module was added to `src/components/launch`. It introduces a typed React context for the launch sequence, a provider component, and a custom hook for consumption.

### Key changes  
- **Imports** (R1‑R2): `createContext`, `useContext` from React and `LaunchPhase` type from `../../app/launchSequence`.  
- **`LaunchContextValue` interface** (R4‑R7): defines `phase: LaunchPhase`, `skipSequence: boolean`, `brandReveal: boolean`.  
- **Context creation** (R10‑R14): default values `phase: "ready"`, `skipSequence: true`, `brandReveal: true`.  
- **`LaunchProvider` component** (R16‑R24): accepts `value` and `children`, renders `<LaunchContext.Provider>`.  
- **`useLaunch` hook** (R26‑R28): returns `useContext(LaunchContext)`.

### Impact  
- **Type safety**: The interface enforces a consistent shape for launch data, catching mismatches at compile time.  
- **Centralized state**: Components can share launch information through a single context, reducing duplicated logic.  
- **Observability**: Default values give a clear starting state for debugging and testing.

### Risks & follow‑ups  
- **Provider omission**: Verify that all consumers of `useLaunch` are wrapped in `LaunchProvider`.  
- **Default value assumptions**: Ensure that the defaults (`"ready"`, `true`, `true`) match the intended UI state.  
- **Type mismatches**: Run TypeScript linting to confirm that `LaunchPhase` values used elsewhere align with the interface.  
- **Testing coverage**: Add unit tests for `LaunchProvider` and `useLaunch` to guard against regressions.
