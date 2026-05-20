### Overview  
A new module `electron/prefetch-summaries.cjs` (lines 1‑241) adds background pre‑fetching of LLM‑generated file summaries. It orchestrates a Rust CLI queue via `runCompareEngine(..., cmd:"prefetch-summary-queue")` and streams progress through IPC events `summary-prefetch-progress`.

### Key changes  
- **Imports** (lines 9‑12): `runCompareEngine`, `summarizeChange`, `buildDiffExcerpt*`, `exportFileSummaryArtifacts`.  
- **Cache & abort**: `summaryByPath` (Map, line 14) and `prefetchAbort` (AbortController, line 17). Functions `clearSummaryPrefetchCache()` (lines 20‑22) and `stopSummaryPrefetchWorker()` (lines 24‑28) manage state.  
- **Prefetch loop** (`runSummaryPrefetchLoop`, lines 64‑216): builds a job queue, iterates over jobs, obtains a diff payload, builds chunks, calls `summarizeChange`, stores the result, optionally exports artifacts, and emits IPC states (`started`, `file-done`, `file-skipped`, `file-error`, `finished`).  
- **Worker control** (`startSummaryPrefetchWorker`, lines 222‑232): starts the loop with a new `AbortController`, returns a promise that resolves on completion.  
- **Default limit** (`defaultPrefetchLimit`, lines 39‑47): reads `NOVADIFF_PREFETCH_MAX`, clamps 1–5000, defaults to 200.  
- **Exports** (lines 235‑241): all public helpers.

### Impact  
- **Performance**: Background worker may increase CPU/memory during large diff sets; aborting mitigates runaway jobs.  
- **Observability**: `summary-prefetch-progress` IPC channel provides fine‑grained progress for UI/debugging.  
- **Configuration**: `NOVADIFF_PREFETCH_MAX` controls queue size.  
- **Packaging**: Additional JS dependencies and exported artifacts increase bundle size; consider lazy loading.  
- **Error handling**: Errors are caught and reported via IPC, preventing crashes but requiring UI handling of `file-error`.

### Risks & follow‑ups  
- **Race conditions**: Verify `prefetchAbort` cancels in‑flight jobs and `stopSummaryPrefetchWorker` cleans the controller.  
- **Cache leakage**: Ensure `clearSummaryPrefetchCache()` runs on worker restart and app shutdown.  
- **IPC reliability**: Test that all `summary-prefetch-progress` messages reach the renderer, especially when `webContents` is null.  
- **Environment variable parsing**: Confirm non‑numeric or negative values fall back to 200 and clamping to 5000 works as intended.
