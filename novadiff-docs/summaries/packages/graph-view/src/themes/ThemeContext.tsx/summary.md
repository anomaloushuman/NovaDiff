### Overview  
In `packages/graph-view/src/themes/ThemeContext.tsx`, the `ThemeProvider` API now accepts an optional `scopeToHost` flag. When true, theme tokens are applied only to a wrapper element instead of the global `document.documentElement`. The helper `resolveInitialTheme` was extended to accept this flag and skip the local‑storage lookup.

### Key changes  
- **`resolveInitialTheme` (L49‑55)** now takes `scopeToHost?: boolean`; if true it returns `metaTheme ?? DEFAULT_THEME_CONFIG` without reading local storage.  
- **`ThemeProvider` signature (L60‑62)** gains `scopeToHost?: boolean`; the initial state is created with `resolveInitialTheme(metaTheme, scopeToHost)`.  
- **Theme application (L67‑85)** branches: `applyTheme(config, host)` when `scopeToHost` is true, otherwise `applyTheme(config)`.  
- **Local‑storage persistence (L86‑90)** is skipped when `scopeToHost` is true (`initialized.current && !scopeToHost`).  
- **Cleanup (L96‑102)** clears the theme only on the host element when `scopeToHost` is true.  
- **Meta‑theme update (L106‑113)** now updates the config immediately if `scopeToHost` and a `metaTheme` are present, and the effect dependency list includes `scopeToHost`.  
- **Wrapper element (L134‑140)** is rendered only when `scopeToHost` is true, providing a `ref` (`hostRef`) for scoped styling.

### Impact  
- **Global CSS isolation**: When `scopeToHost` is true, theme variables are confined to the wrapper, preventing accidental overrides of other parts of the app.  
- **Local‑storage behavior**: Theme selections are not persisted while scoped; this is intentional per the new logic.  
- **Cleanup correctness**: `clearTheme` is invoked only on the host element during unmount, avoiding stray CSS variables.

### Risks & follow‑ups  
- **Regression**: Components that previously relied on global theme variables may break when `scopeToHost` is enabled; visual regression tests are recommended.  
- **Persistence loss**: Confirm that non‑persistence of user‑selected themes while scoped is acceptable for the intended use case.  
- **Dependency validation**: The updated `useEffect` dependencies (`[metaTheme, scopeToHost]`) should be reviewed to avoid stale closures or unnecessary re‑applications.
