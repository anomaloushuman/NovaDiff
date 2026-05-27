### Overview  
A new file `electron/liquid-glass.cjs` is added. It provides optional native Liquid Glass support on macOS by lazily loading the `electron-liquid-glass` addon and exposing a single exported function `applyLiquidGlassToWindow`.

### Key changes  
- `loadLiquidGlass()` (lines 6‑19) requires `electron-liquid-glass` only on first call, caches the module, and falls back to `null` if the require fails. A warning is logged (`console.warn`) when the addon is unavailable.  
- `applyLiquidGlassToWindow()` (lines 29‑56) checks `process.platform` and returns `{ enabled: false, reason: "platform_not_supported" }` on non‑darwin systems (lines 30‑32).  
- It verifies the window exists and is not destroyed before attempting to add a view (lines 33‑35).  
- If the addon is missing or `addView` is not a function, it returns `{ enabled: false, reason: "module_unavailable" }` (lines 36‑38).  
- The function attempts to add a view with specific options (corner radius, tint, opacity) and sets window button visibility. On success it returns `{ enabled: true, viewId }`; on failure it logs a warning and returns `{ enabled: false, reason: "apply_failed" }` (lines 41‑54).  
- The module exports only `applyLiquidGlassToWindow` (lines 58‑60).

### Impact  
- Graceful degradation: the addon is optional; missing modules or unsupported platforms do not crash the app.  
- Lazy loading and caching reduce overhead; subsequent calls reuse the cached module.  
- Console warnings provide visibility into missing addon or application errors.

### Risks & follow‑ups  
- If `electron-liquid-glass` is unavailable on macOS, the function will log a warning and return disabled; verify that this behavior is acceptable.  
- API stability of `win.setWindowButtonVisibility` and `addView` is unknown from the diff; monitor for changes in future Electron releases.  
- No tests are added in this change; consider adding unit tests for supported/unsupported platforms and destroyed window scenarios.  
- Bundle size impact of the optional `require` is unknown; confirm that the production bundle remains unchanged when the addon is absent.
