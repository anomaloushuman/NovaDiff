### Overview
`ThemeContext.tsx` now supports a *Liquid Glass* host mode. The provider tracks whether the current document is a Liquid Glass host, applies the appropriate theme tokens, and cleans them up on unmount. Import statements and effect dependencies were updated accordingly.

### Key changes
- **Imports**: added `applyLiquidGlassEmbedTheme`, `clearLiquidGlassEmbedTheme`, and `isLiquidGlassHost` from `./theme-engine.ts`; removed the old `applyTheme, clearTheme` import (diff lines 13‑19).  
- **State**: introduced `liquidGlassHost` (`useState(isLiquidGlassHost)`) to cache host status (line 80).  
- **Effect**: added a `MutationObserver` on `document.documentElement` to keep `liquidGlassHost` in sync (lines 82‑89).  
- **Theme application**: inside the main `useEffect` (lines 91‑110) the logic now:
  - Calls `applyLiquidGlassEmbedTheme` when `liquidGlassHost` is true, otherwise falls back to `applyTheme`.  
  - Adds `liquidGlassHost` to the dependency array (line 111).  
- **Cleanup**: added a separate `useEffect` (lines 112‑124) that clears the Liquid Glass theme on unmount when `scopeToHost` is true.  
- **Meta‑theme handling**: a new `useEffect` (lines 125‑134) updates the config when `metaTheme` arrives asynchronously and no localStorage value exists.

### Impact
- The provider now correctly applies and removes Liquid Glass styles, preventing residual tokens after unmount.  
- The mutation observer runs only once on mount and is cleaned up immediately, keeping overhead minimal.  
- Existing consumers of `ThemeProvider` remain unchanged; only the internal logic differs.

### Risks & follow‑ups
- Verify that `applyLiquidGlassEmbedTheme` and `clearLiquidGlassEmbedTheme` are idempotent; a double‑apply could corrupt styles.  
- Ensure the mutation observer does not trigger excessively on unrelated class changes; consider debouncing if needed.  
- Confirm that the meta‑theme effect does not unintentionally override user preferences; the precedence logic still matches the intended UX.  
- Add unit tests for the new `liquidGlassHost` state path and cleanup effect to cover edge cases.
