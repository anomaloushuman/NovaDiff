### Overview  
`src/components/CodeCityView.tsx` (added) implements a 3‑D view of code cities with Three.js. It replaces the previous placeholder and exposes a React component that renders the city, handles user interaction, and cleans up on unmount.

### Key changes  
- **Imports** (lines 1‑3): `useEffect`, `useRef` from React; `three` core; `OrbitControls` from `three/examples/jsm/controls/OrbitControls.js`.  
- **Type imports** (lines 5‑6): `CodeCityLayoutResult`, `CodeCityRenderableBuilding` from `../app/codeCityLayout`.  
- **`attachSelectable` helper** (lines 9‑14): recursively assigns `object.userData.building` to every child of a building group, enabling hit‑testing.  
- **`CodeCityView` component** (lines 16‑263):  
  - Builds a Three.js scene, camera, renderer, ambient and directional lights, a grid helper, and meshes for districts and buildings.  
  - Uses `OrbitControls` for navigation and a `Raycaster` to detect clicks on building meshes, calling the supplied `onSelect`.  
  - Observes the container with `ResizeObserver` to keep camera aspect and renderer size in sync.  
  - Disposes all Three.js objects and removes event listeners on unmount.  
- **UI fallback** (lines 218‑225): shows a friendly message when `layout.buildings` is empty.

### Impact  
- Provides a fully interactive 3‑D rendering of the city layout.  
- Centralizes Three.js setup in a single component, keeping mesh‑tagging logic isolated via `attachSelectable`.  
- Uses `requestAnimationFrame` for continuous rendering and `OrbitControls` damping for smooth navigation.  
- No new global state or external APIs are introduced.

### Risks & follow‑ups  
- **Memory leaks**: `dispose()` is called on renderer, controls, and scene, but `attachSelectable` may leave references; verify cleanup.  
- **Resize handling**: `ResizeObserver` is used; test across browsers, especially on very small or large containers.  
- **Raycaster precision**: nested meshes rely on `userData.building`; confirm that deeply nested buildings are correctly detected.  
- **Compatibility**: importing from `three/examples/jsm/...` may fail in older bundlers; run the production build to confirm.
