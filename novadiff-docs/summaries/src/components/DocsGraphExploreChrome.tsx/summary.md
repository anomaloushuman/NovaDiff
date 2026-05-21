### Overview  
`src/components/DocsGraphExploreChrome.tsx` is a new component that renders a Code City settings UI in a portal and can be docked to the graph minimap. It introduces two prop interfaces (`GraphBuildBarProps` lines 18‑31, `CityExploreBarProps` lines 33‑59), helper logic (`countActiveCityFilters` lines 61‑87, `ExpandCornerIcon` lines 90‑120), and several UI panels (`CityFiltersPanel`, `CityLinkPanel`, `GraphBuildPanel`, `GraphStatsPanel` lines 122‑374). The floating shell (`CodeCityFloatShell` lines 376‑439) manages docked/expanded state with `useLayoutEffect`, `ResizeObserver`, and `MutationObserver`. The top‑level `CodeCityExploreSettings` component (lines 444‑639) mounts the shell into `document.body`, creates an overlay via `createPortal`, and exposes an `expanded` state. A deprecated wrapper `DocsGraphActionBar` (lines 641‑648) forwards props to `CodeCityExploreSettings`. New imports include `createPortal`, `AnimatedOverlay`, `CodeCityGraphToolbar`, `DocsLinkToolbar`, and `CodeCityLayoutResult`.

### Key changes  
- Added interfaces `GraphBuildBarProps` and `CityExploreBarProps`.  
- Implemented `countActiveCityFilters` and `ExpandCornerIcon`.  
- Created panels for filters, linking, build controls, and statistics.  
- Built a dockable shell that updates position with `ResizeObserver` and `MutationObserver`.  
- Mounted the shell into `document.body` and added an overlay portal.  
- Provided a deprecated wrapper for backward compatibility.

### Impact  
- **UI/UX**: Offers filter, linking, and build controls that can be toggled and docked.  
- **Build size**: Adds JSX and portal logic; bundle size increases modestly.  
- **Performance**: Uses continuous `ResizeObserver`/`MutationObserver` callbacks; runtime overhead may be noticeable on large graphs.  
- **Compatibility**: `DocsGraphActionBar` keeps older imports functional; migration to `CodeCityExploreSettings` is recommended.  
- **Observability**: No console logs; layout issues would surface as CSS or positioning glitches.

### Risks & follow‑ups  
- **Layout regressions**: Verify CSS classes (`code-city-float`, `code-city-float--chrome`, etc.) and that the minimap slot receives `data-code-city-expanded`.  
- **Observer leaks**: Ensure observers are disconnected on unmount; current cleanup paths cover most cases but should be validated in edge scenarios.  
- **Portal mounting**: Confirm `document.body` is available in SSR or test environments; the `code-city-body-mount` div should be appended only once.  
- **Deprecated API**: Update documentation and search for remaining `DocsGraphActionBar` imports to avoid accidental use.
