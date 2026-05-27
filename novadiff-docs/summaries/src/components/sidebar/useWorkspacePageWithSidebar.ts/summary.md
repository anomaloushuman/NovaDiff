### Overview  
A new hook `useWorkspacePageWithSidebar` is added to `src/components/sidebar/useWorkspacePageWithSidebar.ts` (lines R1‑62). It centralizes logic for switching workspace pages while coordinating with the sidebar’s collapse state.

### Key changes  
- **Imports**: Lines R1‑R3 add React hooks (`useCallback`, `useEffect`, `useRef`, `useState`) and type imports for `WorkspacePage` and `UseSidebarExpandResult`.  
- **Hook signature**: `export function useWorkspacePageWithSidebar(sidebar: Pick<UseSidebarExpandResult, "panelExpanded" | "requestCollapse">)` (R5‑R6). Only panel state and collapse request are required.  
- **State & refs**: `workspacePage` and `stagePage` (`useState<WorkspacePage>`), `pendingStageRef` (`useRef<WorkspacePage | null>`), `collapseGenerationRef` (`useRef(0)`).  
- **flushStage** (R13‑R16): clears `pendingStageRef` and updates `stagePage`.  
- **scheduleStageLoad** (R18‑R41): if the sidebar is collapsed, flushes immediately; otherwise queues the page, increments a generation counter, and waits for `sidebar.requestCollapse()` to resolve before flushing only if the generation and pending page match.  
- **setWorkspacePage** (R43‑R49): updates `workspacePage` and triggers `scheduleStageLoad`.  
- **Effect** (R51‑R55): on panel expansion, if a pending stage exists, it flushes it immediately.  
- **Return** (R57‑R61): `{ workspacePage, stagePage, setWorkspacePage }`.

### Impact  
- Coordinates page changes with sidebar collapse, reducing UI glitches.  
- Encapsulates sidebar‑aware logic in a single hook, simplifying component code.  
- Uses `useCallback` and refs to avoid unnecessary re‑renders and handle async collapse without race conditions.

### Risks & follow‑ups  
- **Race condition**: `collapseGenerationRef` prevents stale `requestCollapse` resolutions from flushing an outdated page; verify correctness.  
- **Panel state propagation**: callers must pass the correct `panelExpanded` flag; otherwise pending stages may be lost.  
- **Cleanup**: the hook does not clear pending stages on unmount; confirm this is acceptable.  
- **Testing**: add unit tests for `scheduleStageLoad` and the effect to cover collapsed vs. expanded scenarios.
