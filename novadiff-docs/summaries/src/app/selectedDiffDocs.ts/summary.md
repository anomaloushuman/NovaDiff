### Overview  
`src/app/selectedDiffDocs.ts` introduces a selection‑context builder for diff views and several helper utilities.

### Key changes  
- **Imports** (lines 1‑8): `DiffRow`, `DiffSelectionLineRange`, `DiffSelectionSymbolMatch`, `DiffSymbolSpan`, `FileDiffPayload`, `SelectionDocMode`.  
- **Exported predicates** (lines 205‑209): `isSelectableDiffRow(row)` and `isChangedDiffRow(row)`.  
- **Interface** `SelectedDiffDocContext` (lines 213‑225) defines the context returned by the builder.  
- **Core builder** `buildSelectedDiffDocContext(payload, selectedIndices, requestedMode)` (lines 227‑277) orchestrates selection analysis, symbol detection, excerpt generation, and key slugification.  
- **Helper utilities**:  
  - `buildLineRanges` (81‑113) aggregates contiguous line ranges.  
  - `findBestEnclosingSymbol` (145‑170) selects the most relevant symbol.  
  - `buildSelectionLabel` (172‑187) creates a human‑readable label.  
  - `rowsForWindow` (65‑80) and `buildExcerpt` (44‑57) produce context excerpts.  
  - `slugifySelectionKey` (196‑203) normalizes the selection key.

### Impact  
- The builder now checks for empty payloads and non‑selectable rows (lines 232‑240).  
- It chooses a symbol when available and sets `effectiveMode` accordingly (lines 243‑245).  
- Excerpts are capped at 10 k (exact) or 22 k (expanded) characters (lines 251‑257).  
- The selection key is slugified to a maximum of 80 characters (lines 261‑263).

### Risks & follow‑ups  
- Excerpt limits may truncate very large diffs; verify typical diff sizes. (unknown from the available diff/scan evidence)  
- Truncation to 80 characters could cause key collisions; assess uniqueness. (unknown from the available diff/scan evidence)  
- Symbol detection relies on `payload.left_symbols`/`right_symbols`; confirm these arrays are populated in all payloads. (unknown from the available diff/scan evidence)
