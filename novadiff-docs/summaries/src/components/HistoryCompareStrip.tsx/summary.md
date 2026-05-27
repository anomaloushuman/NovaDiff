### Overview  
`src/components/HistoryCompareStrip.tsx` was refactored from a commit‑centric UI to a branch‑centric one. The component now receives branch metadata instead of commit snapshots, removes commit‑specific helpers, and updates the UI text and interaction patterns accordingly.

### Key changes  
- **Imports**  
  - L8 removed: `import type { WorkspaceCommitSnapshot } …`  
  - R8 added: `import type { GitBranchSummary } from "../app/gitTypes"`  
  - R9 added: `import { branchOptionLabel } from "../app/gitHistoryBranches"`  
- **Props (`HistoryCompareStripProps`)**  
  - Removed: `commits`, `baseHash`, `headHash`, `indexing`, `onBaseHash`, `onHeadHash`, `onLiveRepoRoot`.  
  - Added: `branches`, `branchesLoading`, `branchLoadError`, `baseBranch`, `headBranch`, `loading`, `onBaseBranch`, `onHeadBranch`.  
- **Helper functions**  
  - Lines 30‑37 (`truncateSubject`) and 38‑41 (`commitLabel`) were deleted.  
- **UI updates**  
  - Header text changed to “Change history” (L72‑73).  
  - Labels now refer to *branches* (L81‑90).  
  - Select elements use IDs `git-history-base-branch` / `git-history-head-branch` (L105‑106, L174‑175) and populate options via `branchOptionLabel` (L117‑124, L191‑194).  
  - Swap button disabled logic now checks `loading`/`branchesLoading` (L138‑140).  
  - Live toggle label updated to “Compare base branch against live dev folder” (R220).  
  - Compare button `aria-label` changed to “Compare branches” (R230).  
- **Logic changes**  
  - `canCompare` now relies on branch metadata (`baseMeta`, `headMeta`) and loading flags (L62‑66, L58‑61).  

### Impact  
- **API**: Callers must switch from commit hashes to branch names; TypeScript errors will surface if unchanged.  
- **Branch lookup**: Replaces commit lookup; the array size is typically smaller.  
- **Error handling**: `branchLoadError` is displayed after the compare button (L241).  

### Risks & follow‑ups  
1. **API breakage** – Existing components that passed commit hashes will fail to compile.  
2. **Missing branch metadata** – If `branches` lacks a matching `baseBranch`/`headBranch`, `canCompare` will be false; verify fallback UI.  
3. **`branchOptionLabel` import** – Ensure the symbol is exported; otherwise the build fails.  
4. **Accessibility** – Test the new `aria-label` values with screen readers.
