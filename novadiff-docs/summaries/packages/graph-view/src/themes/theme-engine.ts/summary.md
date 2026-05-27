### Overview  
The theme engine now supports a *macOS liquid‑glass* host mode. New constants and helper functions expose a lightweight “transparent” theme that can be applied and cleared on demand, while a host‑detection helper is added.

### Key changes  
- **Constants** `LIQUID_GLASS_TRANSPARENT_SURFACE_KEYS` and `LIQUID_GLASS_TRANSPARENT_DERIVED_KEYS` (lines 71‑83) list CSS variables that should be set to `transparent` for the liquid‑glass host.  
- **`applyLiquidGlassEmbedTheme`** (exported at line 86) calls `applyTheme`, then overrides the surface and derived keys to `transparent`, sets background colors to `transparent`, and adds a `data-liquid-glass="true"` attribute.  
- **`clearLiquidGlassEmbedTheme`** (exported at line 103) removes all overridden properties and the attribute, restoring the host to its original state.  
- **`isLiquidGlassHost`** (exported at line 115) checks for the `app-liquid-glass` class on `document.documentElement`, enabling conditional logic in the host.  
- Existing `applyTheme` and `clearTheme` functions remain unchanged.

### Impact  
- **Correctness**: The new helpers provide a dedicated API for embedding the graph view in NovaDiff’s liquid‑glass environment without leaking theme variables.  
- **Maintainability**: Constants are typed as `as const`, preventing accidental mutation.  
- **Performance**: Each helper performs a bounded number of `style.setProperty`/`removeProperty` calls (≈ 10 per call), negligible for typical DOM sizes.  
- **Compatibility**: `isLiquidGlassHost` guards against `document` being undefined, making the module safe in SSR contexts.

### Risks & follow‑ups  
- Verify that `applyLiquidGlassEmbedTheme` is only called when `document` exists; otherwise it will throw.  
- Ensure `clearLiquidGlassEmbedTheme` is invoked during teardown to avoid residual `transparent` styles leaking into other components.  
- Run existing theme‑clearing tests to confirm that the new helpers do not interfere with `clearTheme`.  
- Confirm that the `data-liquid-glass` attribute does not clash with any other attributes used by NovaDiff.
