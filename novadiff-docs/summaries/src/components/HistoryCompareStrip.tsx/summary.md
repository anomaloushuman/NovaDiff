### Overview  
A new component `HistoryCompareStrip` is added in `src/components/HistoryCompareStrip.tsx` (lines 1‑212). It renders a header strip that lets the user pick a base commit, a head commit (or a live folder), and trigger a comparison.

### Key changes  
- **Imports** (lines 1‑7):  
  ```ts
  import { ArrowLeftRight, ChevronDown, GitBranch, GitCompareArrows, Loader2 } from "lucide-react";
  import type { WorkspaceCommitSnapshot } from "../app/workspaceTypes";
  ```
- **Props interface** (lines 10‑27): `HistoryCompareStripProps` declares `commits`, `baseHash`, `headHash`, `useLiveHead`, `liveRepoRoot`, `busy`, `error`, `indexing`, and callbacks `onBaseHash`, `onHeadHash`, `onUseLiveHead`, `onLiveRepoRoot`, `onBrowseLiveRepo`, `onLiveRepoBlur`, `onSwap`, `onCompare`.  
- **Helper functions** (lines 29‑40): `truncateSubject` trims and shortens a subject; `commitLabel` formats a commit label.  
- **Component** (lines 41‑212): computes `base` and `head` from `commits`, determines `canCompare` based on `indexing`, `busy`, and `useLiveHead`; renders selectors, a live‑folder toggle, and a compare button that shows `Loader2` when `busy`. Exported with `export function HistoryCompareStrip`.

### Impact  
Adds a self‑contained UI element; no existing modules are modified. The component relies on the `commits` array and hash matching to populate selectors.

### Risks & follow‑ups  
- `commits` must contain matching hashes; otherwise selectors show “Choose base/…”.  
- The `onCompare` callback must be wired to perform the comparison; otherwise the button is inert.  
- Verify that the live‑folder toggle correctly enables the input field and disables the head selector.  
- Confirm that `Loader2` and `GitCompareArrows` render correctly in the current theme.
