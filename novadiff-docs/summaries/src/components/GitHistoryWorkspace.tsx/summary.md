### Overview  
`src/components/GitHistoryWorkspace.tsx` now accepts an optional `onRefreshHistory` callback and renders a “Sync from git” button when the prop is supplied. The component also imports the `RefreshCw` icon from `lucide-react`.

### Key changes  
- **Import** – line 2 added `RefreshCw` to the `lucide-react` import (diff: L2 removed, R2 added).  
- **Props interface** – line 22 added `onRefreshHistory?: () => void | Promise<void>;` (R22).  
- **Component signature** – line 32 added `onRefreshHistory` to the destructured props (R32).  
- **UI** – lines 171‑181 added a conditional button that calls `onRefreshHistory`. The button is disabled while `indexing` is true and uses the `RefreshCw` icon (R171‑R181).

### Impact  
- The new prop is optional; existing consumers are unaffected.  
- Provides a visible trigger for manual history sync.  
- No measurable performance change beyond a small conditional render.

### Risks & follow‑ups  
- Verify that the `RefreshCw` icon resolves correctly in the build (import added).  
- Confirm the button renders only when `onRefreshHistory` is passed and is disabled during indexing (test suite).  
- Update documentation to reflect the new optional prop and its purpose.
