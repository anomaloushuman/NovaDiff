### Overview  
A new `WarningBanner` component is added at `packages/graph-view/src/components/WarningBanner.tsx`.  
It renders a collapsible banner that summarizes `GraphIssue` entries and provides a copy‑to‑clipboard action.

### Key changes  
- **Imports** – lines 1‑2 add `useState`, `useCallback` from React and the `GraphIssue` type from `@novadiff/graph-core/schema`.  
- **Props** – interface `WarningBannerProps` (lines 4‑6) declares `issues: GraphIssue[]`.  
- **Utility** – `buildCopyText(issues)` (line 8) builds a human‑readable text block, ordering issues by severity (`fatal`, `dropped`, `auto‑corrected`).  
- **State** – `expanded` toggles the detail panel; `copied` shows a temporary “Copied!” indicator.  
- **Copy logic** – `handleCopy` (lines 69‑78) writes the text to the clipboard via `navigator.clipboard.writeText`; on failure it logs a warning.  
- **Conditional styling** – banner colors and messages switch between “fatal” (red) and “non‑fatal” (amber) states, determined by `hasFatal`.  
- **Rendering** – collapsed row shows a summary; expanded panel lists issues grouped by level with icons and counts.  
- **Export** – default export of the component (line 45).

### Impact  
- **UI** – introduces a new banner; no API changes.  
- **Dependencies** – requires the `GraphIssue` type from the schema package.  
- **Clipboard** – relies on the browser’s Clipboard API; the component handles write errors by logging a warning.  
- **Performance** – linear scans of the `issues` array (≤ O(n)); negligible for typical sizes.  
- **Testing** – the diff shows no existing tests for this component; unit and integration tests are required.

### Risks & follow‑ups  
- The component returns `null` when `issues.length === 0` (line 80).  
- No tests cover the component; add unit tests for `buildCopyText` and rendering with various issue counts.  
- Ensure the referenced CSS classes (`bg-red-900/25`, `bg-amber-900/20`, etc.) exist in the global stylesheet.  
- Verify that `navigator.clipboard` is available in all target environments; fallback UI may be needed if unavailable.
