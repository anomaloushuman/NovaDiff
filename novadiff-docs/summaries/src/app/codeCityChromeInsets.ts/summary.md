### Overview  
A new file `src/app/codeCityChromeInsets.ts` (added, change kind: added, line range R1‑92) introduces utilities for computing the insets required by the CodeCity UI.

### Key changes  
- **`export interface CodeCityChromeInsets`** (lines 1‑6) defines `bottom`, `right`, `left`, and `hidden`.  
- **`export interface MeasureCodeCityChromeOptions`** (lines 40‑43) adds an optional `dockedControls` flag.  
- **`rectsOverlap(a, b)`** (lines 10‑12) checks whether two `DOMRect`s overlap.  
- **`liftForObstruction(hostRect, obstruction, bottom)`** (lines 14‑22) returns a new bottom inset when an obstruction overlaps the host.  
- **`isBlockingModalOpen()`** (lines 24‑38) scans for several modal/backdrop selectors to short‑circuit inset calculation.  
- **`measureCodeCityChromeInsets(host, options)`** (lines 49‑92) orchestrates the logic: early exit on blocking modal, gathers obstructions (sheet, activity bar), lifts the bottom inset, caps it, and returns a `CodeCityChromeInsets` object.

### Impact  
- Provides a typed contract for inset values.  
- Early exit on modal sets `hidden: true`, allowing callers to suppress the UI when a modal is open.  
- Obstruction handling lifts the bottom inset based on overlapping elements.  
- The module is additive; existing exports remain unchanged.

### Risks & follow‑ups  
- **Modal detection** – verify that all selectors in `isBlockingModalOpen` still match the current DOM; a missing selector could cause the UI to render while a modal is open.  
- **Layout row query** – the fallback to `.novadiff-graph-embed` may fail if the layout changes; test both paths.  
- **Hidden flag usage** – callers must interpret `hidden: true` correctly to avoid rendering the UI when a modal is open.
