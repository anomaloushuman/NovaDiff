### Overview  
`packages/graph-view/src/themes/ThemeContext.tsx` introduces a React context for theme state, a `ThemeProvider` component, and a `useTheme` hook. The file adds local‑storage persistence, optional host scoping, and utilities for preset resolution.

### Key changes  
- **Imports** (R1‑R13) bring `HeadingFont, PresetId, ThemeConfig, ThemePreset` from `./types.ts`, `DEFAULT_THEME_CONFIG` from the same file, `getPreset` from `./presets.ts`, and `applyTheme, clearTheme` from `./theme-engine.ts`.  
- **Context API**: `ThemeContext` is created at R25 with `createContext<ThemeContextValue | null>(null)` and exported via `ThemeProvider`.  
- **Persistence helpers**: `loadFromLocalStorage` (R27‑40) reads a JSON string under key `"ua-theme"` (R15); `saveToLocalStorage` (R41‑47) writes the same key.  
- **Initial theme resolution**: `resolveInitialTheme` (R49‑51) prefers local storage, then `metaTheme`, finally `DEFAULT_THEME_CONFIG`.  
- **Provider logic** (`ThemeProvider` at R60‑135):  
  - State `config` initialized by `resolveInitialTheme`.  
  - `useEffect` (R68‑82) applies theme on mount and on config changes, optionally scoping to a host `<div>` when `scopeToHost` is true.  
  - Second `useEffect` (R84‑94) clears host theme on unmount if scoped.  
  - Third `useEffect` (R96‑101) updates config when an async `metaTheme` arrives and no local preference exists.  
  - `setPreset` (R103‑108), `setAccent` (R110‑112), and `setHeadingFont` (R114‑116) update config via `useCallback`.  
- **Hook** (`useTheme` at R136‑140) consumes `ThemeContext` and throws if used outside a provider.

### Impact  
- Centralizes theme logic and state, reducing duplication.  
- Local‑storage sync prevents stale themes across reloads.  
- Host scoping (when `scopeToHost` is true) confines CSS changes to a wrapper `<div>`, avoiding global thrashing.  
- Existing components that call `useTheme` continue to work; no API changes.

### Risks & follow‑ups  
- `loadFromLocalStorage` silently swallows parse errors (R36‑38); malformed data may be ignored.  
- If `scopeToHost` is true but the host `<div>` is missing, theme application fails silently (R70‑75).  
- The third `useEffect` (R96‑101) may override a user‑selected preset if `metaTheme` arrives after a local change; verify ordering.  
- `clearTheme` runs only on unmount when scoped (R88‑92); confirm global themes persist correctly after provider removal.
