### Overview  
`EmbedGraphPanel` now adapts its theme to the user’s system color‑scheme. The component imports `resolveNovaDiffEmbedTheme` (R12), stores the resolved theme in state (`embedTheme`, R84), and updates it on mount and whenever the `prefers-color-scheme` media query changes (R86‑R95). The `ThemeProvider` now receives this dynamic theme (`metaTheme={embedTheme}`, R98) instead of a static `null` value (L85 removed).

### Key changes  
- **Import added**: `resolveNovaDiffEmbedTheme` from `./themes/novadiffEmbed` (R12).  
- **State introduced**: `embedTheme` initialized with `resolveNovaDiffEmbedTheme` (R84).  
- **Effect added**: listens to `prefers-color-scheme` changes, calling `resolveNovaDiffEmbedTheme()` and updating `embedTheme` (R86‑R95).  
- **ThemeProvider updated**: `metaTheme` now receives `embedTheme` (R98).  
- **Legacy metaTheme removed**: the previous `metaTheme={null}` line (L85) is gone.

### Impact  
The graph panel will now automatically switch between light and dark NovaDiff themes in response to the user’s system preference, improving visual consistency across the application.

### Risks & follow‑ups  
- **Browser support**: The code guards against missing `window.matchMedia`, so no runtime error is expected.  
- **Testing**: Verify that the theme updates correctly when toggling the system color scheme and that the graph renders with the new theme.  
- **Future maintenance**: Ensure `resolveNovaDiffEmbedTheme` remains up‑to‑date with any theme changes.
