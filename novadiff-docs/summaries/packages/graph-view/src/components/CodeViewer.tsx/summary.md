### Overview
`packages/graph-view/src/components/CodeViewer.tsx` was refactored to improve line‑range handling, scrolling, and the explain‑code workflow. The component now imports `useRef` and the `GraphNode` type from `@novadiff/graph-core/types` (see R1‑R2). A new helper `lineRangeForNode` (R63‑R76) extracts a `[start, end]` pair from a node’s `lineRange` or from the numeric suffix of its ID.  

### Key changes
- **Imports** – added `useRef` and `GraphNode` (R1‑R2).  
- **`lineRangeForNode`** – parses `node.lineRange` or the ID suffix to return a `[number, number]` or `null` (R63‑R76).  
- **Highlighting logic** – `highlightedRange` now uses `lineRangeForNode` when `node.lineRange` is absent (R196‑R204).  
- **Explain‑code range** – `explainRange` is derived from `userSelection` or the node’s range (R263‑R264).  
- **Explain‑code call** – passes `explainRange.start`/`end` instead of `userSelection` (R285‑R286).  
- **Scroll target** – `scrollTargetLineRef` tracks the line to scroll to, updated in a `useEffect` (R206‑R238).  
- **UI** – button text now shows “Explain code” or “Explain function” based on selection (R337).  
- **Modal subtitle** – displays the node’s file path and the selected line range (R454‑R455).  

### Impact
The viewer now correctly highlights node ranges even when `lineRange` is missing, and the explain‑code feature uses the accurate range. Scrolling to the highlighted line is smoother and avoids redundant scrolls. UI changes improve clarity for users selecting lines or functions.

### Risks & follow‑ups
- The new `lineRangeForNode` assumes numeric ID suffixes; if node IDs change format, the helper may return `null`.  
- The refactor removes the old `node.lineRange` check; ensure downstream consumers do not rely on the previous logic.  
- No tests were updated in the diff; run the existing test suite to confirm behavior.
