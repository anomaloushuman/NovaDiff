### Overview  
`packages/graph-view/src/EmbedDashboardPanel.tsx` now resolves the embed theme at runtime instead of using a static constant. The component tracks the user’s preferred color scheme and updates the theme accordingly.

### Key changes  
- **Import swap** – `NOVADIFF_EMBED_THEME` removed (L12); `resolveNovaDiffEmbedTheme` added (R12).  
- **State added** – `const [embedTheme, setEmbedTheme] = useState(resolveNovaDiffEmbedTheme);` (R74).  
- **Effect added** – `useEffect` listens to `prefers-color-scheme` changes and updates `embedTheme` (R76‑R85).  
- **ThemeProvider updated** – `metaTheme={embedTheme}` replaces the static theme (R88).  
- Minor spacing and unused‑import cleanup.

### Impact  
- **UX** – The panel now reflects system dark/light mode.  
- **Maintainability** – Theme logic is centralized in `resolveNovaDiffEmbedTheme`.  
- **Performance** – The effect runs only on mount and when the media query changes; negligible cost.  
- **API** – No changes to props or rendering logic.

### Risks & follow‑ups  
- **SSR** – The effect checks `typeof window`; confirm a fallback theme renders correctly on the server.  
- **Browser support** – Verify graceful fallback when `matchMedia` or its event API is unavailable.  
- **Theme resolution** – Ensure `resolveNovaDiffEmbedTheme` returns the expected theme object; run unit tests for this helper.  
- **Visual regression** – Capture screenshots of the embed panel in both light and dark modes to detect unintended styling changes.
