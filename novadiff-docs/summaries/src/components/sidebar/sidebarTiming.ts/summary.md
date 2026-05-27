### Overview  
`src/components/sidebar/sidebarTiming.ts` now contains four exported timing constants that control the sidebar’s debounce, erase fallback, width transition, and forced‑collapse durations. The file was added in lines R1‑R12, with JSDoc comments describing each constant.

### Key changes  
- `export const SIDEBAR_LEAVE_DELAY_MS = 160;` – debounce delay before erase starts after pointer/focus leaves (R2).  
- `export const SIDEBAR_ERASE_FALLBACK_MS = 580;` – maximum wait for label erase before panel width closes (R5).  
- `export const SIDEBAR_WIDTH_TRANSITION_MS = 320;` – CSS width transition duration on `.launch-panel--side` / `.sidebar` (R8).  
- `export const SIDEBAR_FORCE_COLLAPSE_MS = SIDEBAR_ERASE_FALLBACK_MS + SIDEBAR_WIDTH_TRANSITION_MS;` – total duration for a full collapse used during navigation (R11‑R12).  
- Descriptive JSDoc comments added for each constant (R1, R4, R7).

### Impact  
- **Maintainability** – centralizes timing values, reducing duplication.  
- **Consistency** – all sidebar animations reference the same durations, preventing visual glitches.  
- **Observability** – exposed constants can be logged or monitored if needed.  
- **Build** – the file is pure TypeScript; it compiles with existing linting and test suites.

### Risks & follow‑ups  
- **Unused export** – no imports of these constants were detected in the current scan; verify that they are integrated into the sidebar logic before use.  
- **Animation sync** – ensure that any hard‑coded durations elsewhere match the new `SIDEBAR_FORCE_COLLAPSE_MS` value to avoid timing mismatches.  
- **Performance** – constants are trivial; confirm that the added file does not introduce lint or build warnings that could affect CI.  
- **Documentation** – update any design docs or README sections that previously listed hard‑coded timing values.
