### Overview  
`src/app/BackgroundActivityContext.tsx` adds a React context for background task tracking. It defines typed activity data, action helpers, and hooks for consumption.

### Key changes  
- **Imports** – React hooks and `ReactNode` (R1‑6).  
- **Types** – `BackgroundActivityKind` union (R10‑19) and `BackgroundActivity` interface (R22‑30).  
- **Patch helper** – `UpsertPatch` type and `sameActivity` comparison (R32‑45).  
- **Context interfaces** – `BackgroundActivityActions` (R48‑51) and `BackgroundActivityContextValue` (R54‑56).  
- **Contexts** – `BackgroundActivityContext` and `BackgroundActivityActionsContext` (R58‑64).  
- **Provider** – `BackgroundActivityProvider` (R65‑139) manages state, exposes `upsertActivity`, `removeActivity`, `clearActivities`, memoizes actions and value, and nests providers.  
- **Hooks** – `useBackgroundActivity`, `useBackgroundActivityOptional`, `useBackgroundActivityActions`, and `useBackgroundActivityActionsOptional` (R140‑166) expose context values with safety checks.

### Impact  
- **Type safety** – Activities are strongly typed and sorted by `startedAt`.  
- **Centralized state** – Reduces duplication; memoized actions keep references stable for effect dependencies.  
- **Efficient updates** – State changes only propagate when activities differ; equality checks prevent unnecessary re‑renders.  
- **Standalone module** – No existing files are altered; it can be imported independently.

### Risks & follow‑ups  
- **Concurrent updates** – Verify that `upsertActivity` merges patches correctly under race conditions.  
- **Provider usage** – `useBackgroundActivity` throws an error when called outside the provider; unit tests should confirm this.  
- **Clear logic** – Test `clearActivities(undefined)` and `clearActivities(kind)` to ensure expected behavior.  
- **Default kind** – Activities without an explicit `kind` default to `"other"` (R76‑77).
