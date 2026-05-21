### Overview  
`src/app/DocsViewSyncContext.tsx` adds a React context that synchronizes documentation view state with the CodeCity graph. It exports an interface, a provider component, and three hooks for consuming the context.

### Key changes  
- **Imports** (`R1‑R10`): React hooks and `CodeCityRenderableBuilding`.  
- **`DocsViewSyncState` interface** (`R12‑R25`): flags for linking and focus, selected node/building, and mutation callbacks.  
- **Context creation** (`R27`): `createContext<DocsViewSyncState | null>(null)`.  
- **`DocsViewSyncProvider`** (`R29‑R124`): initializes state with `useState`, exposes setters, and memoizes the value (`R92‑R118`).  
- **`useDocsViewSync`** (`R126‑R131`): throws if the provider is missing (`R128‑R130`).  
- **`useDocsViewSyncOptional`** (`R134‑R136`): returns the context or `null`.  
- **`useDocsViewSyncExternalNode`** (`R138‑R149`): when `enabled` and `linkViews` are true, calls `sync.setSelectionFromGraph(nodeId)` inside a `useEffect` (`R143‑R148`).  

No existing files are modified; the module is entirely new.

### Impact  
- **Correctness**: state mutations are confined to the provider; consumers must be wrapped.  
- **Maintainability**: all sync logic resides in one place, easing future updates.  
- **Performance**: `useMemo` and `useCallback` keep the context value stable, reducing unnecessary re‑renders.  
- **Compatibility**: components that previously relied on implicit sync must now import and use the new hooks.

### Risks & follow‑ups  
- **Provider omission**: `useDocsViewSync` throws if used outside the provider (`R128‑R130`). Verify all consumers are wrapped.  
- **Null context**: `useDocsViewSyncOptional` may return `null` (`R134‑R136`); callers must handle this case.  
- **Effect dependencies**: `useDocsViewSyncExternalNode` depends on `sync` (`R143‑R148`); ensure the context reference does not change unexpectedly.  
- **Lint & build**: run `npm run lint`, `npm test`, and `npm run build` to confirm no TypeScript or ESLint errors.
