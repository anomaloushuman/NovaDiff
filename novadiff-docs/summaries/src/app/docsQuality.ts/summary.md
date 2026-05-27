### Overview  
`src/app/docsQuality.ts` now separates heuristic and advisory risk signals.  
The confidence‑badge logic and the release‑overview markdown generation have been rewritten to use these two source categories, replacing the previous single‑signal check.

### Key changes  
- **`deriveConfidenceBadges` (lines 75‑152)**  
  - Added `heuristicSignals` and `advisorySignals` filters (diff lines 111‑113).  
  - New badge logic:  
    - `high-risk-signals` is triggered only by high‑severity *heuristic* signals (diff line 115).  
    - `risk-signals` is added when any heuristic signal exists (diff line 122).  
    - `advisory-signals` is added when any advisory signal exists (diff lines 128‑135).  
  - Removed the old `else if (riskSignals.length > 0)` branch (diff line 118).  
- **`buildReleaseOverviewMarkdown` (lines 153‑260)**  
  - Extracts `advisorySignals` at line 163.  
  - Replaces the static advisory status paragraph (lines 245‑246) with a dynamic message that shows the count of advisory findings or notes their absence (diff lines 256‑258).  
  - All other sections remain unchanged but now reference the new `advisorySignals` array.  
- Function signatures are unchanged.

### Impact  
- The high‑risk badge now reflects only heuristic signals, preventing false positives from advisory data.  
- An `advisory-signals` badge and an advisory enrichment status section provide clearer insight into advisory coverage.  
- The code now explicitly separates heuristic and advisory sources, simplifying future extensions.

### Risks & follow‑ups  
- Verify that `heuristicSignals` and `advisorySignals` are correctly populated when all signals share the same source.  
- Ensure the advisory enrichment status renders correctly when `advisorySignals.length === 0`.  
- Confirm that badge keys remain unique; duplicate keys are suppressed by the `push` helper.
