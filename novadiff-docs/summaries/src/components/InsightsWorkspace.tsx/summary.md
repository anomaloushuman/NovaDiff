### Overview  
A new component `InsightsWorkspace` is added in `src/components`. It provides a security‑insights workspace that runs heuristic and advisory scans, stores the user’s advisory‑scan preference, and displays findings grouped by category.

### Key changes  
- **Imports** (lines 1‑6): React hooks (`useCallback`, `useEffect`, `useMemo`, `useState`), types (`FileChange`, `RiskSignal`, `SecurityInsightReport`), and helpers `groupSecuritySignals`, `mergeRiskSignals` from `../app/securityInsights`.  
- **`loadAdvisoryDefault`** (lines 10‑17): Reads the `novadiff_insights_advisory_enabled` flag from `localStorage`, defaulting to `false`.  
- **`InsightsWorkspaceProps`** (lines 18‑24): Declares props for comparison status, root paths, change rows, and a jump callback.  
- **`RiskSection`** (lines 26‑81): Renders a risk category with optional “Open diff” buttons.  
- **State & effects** (lines 90‑106): Manages heuristic/advisory signals, loading, errors, and persists `advisoryEnabled` to `localStorage`.  
- **Scan callbacks** (`runHeuristicScan`, `runAdvisoryScan`, lines 108‑196): Call `window.electronAPI.scanRiskSignals` and `scanSecurityInsights`, handling cancellation, errors, and state updates.  
- **Signal merging & grouping** (lines 209‑213): Uses `mergeRiskSignals` and `groupSecuritySignals` to prepare data for rendering.  
- **UI rendering** (lines 215‑319): Shows controls, loading states, error alerts, source lists, and four `RiskSection` instances for vulnerabilities, dependencies, memory leaks, and function completeness, plus an optional “Other” section.

### Impact  
- Requires `window.electronAPI` to expose `scanRiskSignals` and `scanSecurityInsights`; otherwise scans fail.  
- Persists the advisory‑scan toggle in `localStorage`; failures are ignored silently.  
- Scans run asynchronously; UI may block while awaiting results, especially for large diffs.  
- Centralizes risk logic, simplifying future updates to signal handling.

### Risks & follow‑ups  
- **Electron API availability**: Verify that `window.electronAPI` implements the expected methods.  
- **LocalStorage errors**: Ensure graceful degradation when storage access throws (e.g., in incognito).  
- **Signal merging logic**: Confirm that `mergeRiskSignals` deduplicates and prioritizes findings; add tests for edge cases.  
- **UI rendering**: Check that all risk categories render correctly, even when empty, and that the “Other” section appears only when needed.
