### Overview  
A new component `HistoryCompareStrip` is added at `src/components/HistoryCompareStrip.tsx` (lines 1‑212). It renders a header strip that lets the user pick a base commit, a head commit or a live repository folder, swap the two, and trigger a comparison.

### Key changes  
- **Imports** (lines 1‑7): icons `ArrowLeftRight`, `ChevronDown`, `GitBranch`, `GitCompareArrows`, `Loader2` from *lucide-react*.  
- **Type imports** (lines 8‑9): `WorkspaceCommitSnapshot` from `../app/workspaceTypes` and `pathDisplayLabel` from `../app/pathDisplay`.  
- **Props interface** (lines 11‑28): `HistoryCompareStripProps` defines arrays of commits, hash strings, live‑repo flags, busy/error states, and callbacks for every user action.  
- **Helpers** (lines 30‑36, 38‑40): `truncateSubject` trims a commit subject to 48 chars; `commitLabel` builds the display string.  
- **Component** (lines 42‑212):  
  - Renders a title and description.  
  - Provides a base‑commit `<select>` (lines 98‑110) and a head‑commit `<select>` or live‑repo `<input>` (lines 134‑170).  
  - Swap button (lines 118‑126) and live‑repo toggle checkbox (lines 180‑186).  
  - Compare button (lines 191‑205) is disabled until `canCompare` (lines 62‑66) is true.  
  - Shows a loader icon when `busy` is true (lines 199‑203).  
  - Displays an error message if `error` is set (line 207).  
  - All interactive elements include `aria-label` or `aria-hidden` attributes as shown in the diff.

### Impact  
- Adds a self‑contained UI for commit comparison; no changes to existing components.  
- Requires parent components to provide the full set of callbacks and state values.  
- No new runtime dependencies beyond the imported icons and types.

### Risks & follow‑ups  
- **Regression**: unknown from the available diff/scan evidence whether the new strip interferes with existing commit‑selection logic.  
- **Accessibility**: the component includes `aria-label` attributes, but comprehensive testing is not shown in the diff.  
- **Testing**: unit tests for `truncateSubject`, `commitLabel`, and the enable/disable logic are not present in the current diff.  
- **Linting**: running `tsc`, ESLint, and Prettier should confirm no type or style errors.
