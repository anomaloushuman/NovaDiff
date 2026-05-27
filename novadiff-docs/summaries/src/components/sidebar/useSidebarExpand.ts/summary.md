### Overview  
`src/components/sidebar/useSidebarExpand.ts` was added.  
It exports:

- `SidebarTextPhase` (`"hidden" | "typing" | "erasing"`) – R8  
- `UseSidebarExpandResult` interface – R10‑24  
- `useSidebarExpand()` hook – R26‑211  

The hook manages sidebar expansion, text animation phases, and a promise‑based collapse API.

### Key changes  
- **State & refs** – `pointerInside`, `focusInside`, `panelExpanded`, `textPhase`; refs for timers (`leaveTimerRef`, `eraseTimerRef`, `widthTimerRef`) and flags (`forceCloseRef`, `wantOpenRef`) – R27‑38.  
- **Timer logic** – uses constants from `./sidebarTiming` (`SIDEBAR_LEAVE_DELAY_MS`, `SIDEBAR_ERASE_FALLBACK_MS`, `SIDEBAR_WIDTH_TRANSITION_MS`) – R3‑6.  
- **Collapse flow** – `requestCollapse` returns `Promise<void>` that resolves when the panel fully collapses, handling pending waiters and cleanup – R92‑122.  
- **Event handlers** – `onPointerEnter/Leave`, `onFocusCapture/BlurCapture` guard against forced close and update internal state – R174‑194.  
- **Effect hooks** – three `useEffect` blocks manage expansion, leave delay, and cleanup on unmount – R132‑172.

### Impact  
- Components can now import `useSidebarExpand` to control sidebar visibility and text animation.  
- The hook introduces timer refs; the cleanup effect at R164‑172 clears timers on unmount, mitigating stray callbacks.  
- No existing component APIs are altered, but any component that previously managed sidebar state should migrate to this hook.

### Risks & follow‑ups  
- **Timer cleanup** – verified that timers are cleared on unmount (R164‑172).  
- **Race conditions** – `requestCollapse` queues waiters; ensure concurrent calls resolve correctly.  
- **Focus handling** – `onBlurCapture` uses `event.relatedTarget`; confirm cross‑browser behavior.  
- **Type safety** – consuming components must match the `UseSidebarExpandResult` interface; run TypeScript checks to catch mismatches.
