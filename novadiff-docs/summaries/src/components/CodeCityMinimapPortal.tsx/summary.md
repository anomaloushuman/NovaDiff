### Overview  
`src/components/CodeCityMinimapPortal.tsx` introduces a React portal that mounts a custom minimap into the react‑flow controls host. The component hides the built‑in minimap, attaches itself to the host, and emits a `code-city-dock-host-ready` event when the attachment succeeds. The implementation relies on DOM queries, a `MutationObserver`, and a retry interval to locate the host element.

### Key changes  
- **Imports** (R1‑R3): `useLayoutEffect`, `useRef`, `useState`, `ReactNode` from *react*; `createPortal` from *react-dom*; `CodeCityMinimapSlot` from the local slot component.  
- **Constants** (R5‑R6): `COVER_ROOT = ".knowledge-graph-cover-stage"` and `DOCK_HOST_CLASS = "code-city-graph-dock-host"`.  
- **Helper functions** (R9‑R22):  
  - `findControlsHost()` locates the controls panel in the cover stage.  
  - `hideBuiltInMinimap()` sets the built‑in minimap’s display to `none`.  
- **Exported component** (R27‑R102):  
  - Uses `useState` to track the host element.  
  - `tryAttach()` performs host lookup, hides the built‑in minimap, adds a CSS class, and dispatches the custom event.  
  - `useLayoutEffect` sets up the attachment logic, a retry interval, and a `MutationObserver` to react to DOM changes.  
  - Cleanup removes the class, restores the minimap display, and disconnects observers.  
  - Renders a `<CodeCityMinimapSlot>` inside a portal when the host is available; otherwise falls back to an anchored `<div>`.

### Impact  
The portal replaces the default minimap with a custom one, ensuring it appears in the bottom‑left controls area. It also signals readiness via a custom event, allowing other parts of the application to react once the minimap is docked.

### Risks & follow‑ups  
- **Host element missing**: If the selector `${COVER_ROOT} .react-flow__controls.react-flow__panel.bottom.left` does not match, the component will never attach.  
- **Event name collision**: The custom event `code-city-dock-host-ready` could clash with other listeners.  
- **Cleanup reliability**: The interval and observer must be cleared on unmount; any failure could leave stale listeners.  
- **Styling side‑effects**: Hiding the built‑in minimap via `display: none !important` may interfere with other CSS rules.  
Follow‑up actions include adding unit tests for host detection, verifying event dispatch, and ensuring the cleanup logic runs under all unmount scenarios.
