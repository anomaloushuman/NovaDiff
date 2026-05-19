### Overview
A new file `src/app/BackgroundActivityContext.tsx` (lines 1‑166) introduces a React context for tracking background activities across the app.

### Key changes
- **Imports**: `createContext`, `useCallback`, `useContext`, `useMemo`, `useState`, `ReactNode` from React (R1‑6).  
- **Types**: `BackgroundActivityKind` enum (R10‑19) and `BackgroundActivity` interface (R22‑30).  
- **Helpers**: `sameActivity` comparison (R37‑45) and `UpsertPatch` type (R32‑35).  
- **Contexts**: `BackgroundActivityContext` and `BackgroundActivityActionsContext` (R58‑64).  
- **Provider**: `BackgroundActivityProvider` (R65‑138) manages an array of activities, exposes `upsertActivity`, `removeActivity`, `clearActivities`, and sorts by `startedAt` (R85‑96).  
- **Hooks**: `useBackgroundActivity`, `useBackgroundActivityOptional`, `useBackgroundActivityActions`, `useBackgroundActivityActionsOptional` (R140‑166) with runtime checks (R141‑144, R155‑160).

### Impact
- Centralized activity state reduces duplication; optional hooks allow safe use when the provider may be absent.  
- Runtime errors are thrown if hooks are used outside the provider (lines 141‑144, 155‑160).  
- Activities are sorted on every upsert; the list is small, so re‑render cost is expected to be low.

### Risks & follow‑ups
- **Provider omission**: components using the hooks must be wrapped by `BackgroundActivityProvider`; otherwise errors will occur.  
- **Sorting side‑effects**: verify that ordering by `startedAt` matches UI expectations during concurrent upserts.  
- **Optional hooks**: confirm that `useBackgroundActivityOptional` and `useBackgroundActivityActionsOptional` return `null` when the provider is missing.  
- Run `npm run lint`, `npm test`, and `npm run build` to ensure the new module compiles and passes tests.
