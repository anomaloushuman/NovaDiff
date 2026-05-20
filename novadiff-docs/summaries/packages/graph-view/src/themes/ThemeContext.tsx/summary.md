### Overview  
`packages/graph-view/src/themes/ThemeContext.tsx` now defines a React context for theme handling.  
- New context type `ThemeContextValue` (lines 17‑26).  
- `ThemeContext` created with `createContext<ThemeContextValue | null>(null)` (line 25).  
- `ThemeProvider` component (lines 66‑147) and `useTheme` hook (lines 148‑152) are exported.

### Key changes  
- **Imports** (lines 1‑13): added `createContext`, `useCallback`, `useContext`, `useEffect`, `useRef`, `useState`, `type ReactNode`; type imports from `./types.ts`; constants and helpers from `./presets.ts` and `./theme-engine.ts`.  
- **Persistence helpers**: `loadFromLocalStorage` (lines 27‑40) and `saveToLocalStorage` (lines 41‑47) read/write the key `"ua-theme"`.  
- **Initial theme resolution**: `resolveInitialTheme` (lines 49‑58) chooses between `metaTheme`, localStorage, or `DEFAULT_THEME_CONFIG`.  
- **Provider logic**:  
  - State initialized via `resolveInitialTheme`.  
  - `useEffect` applies theme on mount/update; saves to localStorage only when `scopeToHost` is false and the component has mounted (lines 75‑90).  
  - Cleanup `clearTheme` on unmount when `scopeToHost` is true (lines 92‑102).  
  - Async `metaTheme` updates handled in a separate `useEffect` (lines 104‑113).  
- **Setters**: `setPreset`, `setAccent`, `setHeadingFont` memoized with `useCallback` (lines 115‑128).  
- **Context value**: `{ config, preset, setPreset, setAccent, setHeadingFont }` (line 133).  
- **Hook**: `useTheme` throws if used outside a provider (lines 148‑152).

### Impact  
- **Single source of truth**: Theme state lives only in `ThemeProvider` state and context.  
- **Persistence**: User preferences survive page reloads via localStorage unless overridden by `metaTheme`.  
- **Scoped theming**: `scopeToHost` allows tokens to apply only to a wrapper element, useful for embedded graphs.  
- **Error handling**: LocalStorage errors are caught silently, preventing crashes but hiding failures.  
- **Consumer migration**: Components must now be wrapped in `ThemeProvider` or use `useTheme`.

### Risks & follow‑ups  
- **Silent storage failures**: `saveToLocalStorage` and `loadFromLocalStorage` swallow errors; verify fallback behavior is acceptable.  
- **Provider usage**: `useTheme` throws if called outside a provider; ensure all consumers are updated.  
- **Scope flag logic**: `clearTheme` runs only on unmount when `scopeToHost` is true; confirm cleanup works in embedded scenarios.  
- **Async metaTheme**: The provider updates config when `metaTheme` arrives after mount; test that this does not overwrite a user‑selected preset stored in localStorage.
