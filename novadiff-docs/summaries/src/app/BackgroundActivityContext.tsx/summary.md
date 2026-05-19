### Overview  
A new `src/app/BackgroundActivityContext.tsx` file introduces a React context for tracking background tasks, exposing a provider and two hooks.

### Key changes  
- **Imports**: Adds `createContext`, `useCallback`, `useContext`, `useMemo`, `useState`, and `ReactNode` from *react* (lines 1‑6).  
- **Types**: Declares `BackgroundActivityKind` enum‑like union (lines 10‑19) and `BackgroundActivity` interface (lines 22‑30).  
- **Context value**: Defines `BackgroundActivityContextValue` (lines 37‑41) and creates the context (lines 44‑46).  
- **Provider**: Implements `BackgroundActivityProvider` (lines 48‑95) with state, upsert, remove, and clear logic, sorting activities by `startedAt`.  
- **Hooks**: Exposes `useBackgroundActivity` (lines 97‑103) that throws if used outside the provider, and `useBackgroundActivityOptional` (lines 106‑108) that returns `null` when no provider is present.

### Impact  
- **Correctness**: The provider guarantees a sorted activity list; the optional hook prevents crashes in optional embed paths.  
- **Maintainability**: Centralized activity state simplifies adding new activity kinds or UI components.  
- **Performance**: Sorting on every upsert may be costly with many activities; current implementation is acceptable for typical use.  
- **Compatibility**: No changes to existing modules; the new file is self‑contained and only adds exports.

### Risks & follow‑ups  
- **Provider usage**: Verify that all components consuming the hooks are wrapped by `BackgroundActivityProvider`.  
- **Null handling**: `useBackgroundActivityOptional` may return `null`; callers must guard against it.  
- **Sorting overhead**: Benchmark with high activity churn to ensure sorting does not become a bottleneck.  
- **Default values**: The provider defaults `kind` to `"other"`; confirm this aligns with intended UX for unknown kinds.
