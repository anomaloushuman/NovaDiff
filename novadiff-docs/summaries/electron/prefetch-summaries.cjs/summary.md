### Overview  
`electron/prefetch-summaries.cjs` now runs prefetch jobs with a configurable worker pool instead of a single sequential loop. The change replaces the old `for (let i = 0; i < jobs.length; i++)` block (lines 116‑120) with a concurrency‑controlled loop (lines 116‑122 and 214‑226).

### Key changes  
- **Concurrency calculation** – `concurrency` is set to  
  `Math.min(3, Math.max(1, Number(process.env.NOVADIFF_PREFETCH_CONCURRENCY) || 2))` (added lines 116‑122).  
- **Worker pool** – an async `worker` pulls jobs from a shared `nextIndex` counter; `Promise.all` launches `concurrency` workers (added lines 214‑226).  
- **Abort handling** – the loop now checks `signal.aborted` at the start of each worker iteration, removing the per‑iteration abort check inside the old for‑loop.  
- **Job dispatch** – the old job extraction (`const job = jobs[i]`) is removed.  
- **Error flow** – the `continue` after a non‑text error is replaced with `return` from `runJob`, exiting the current worker early.  
- **Progress reporting** – IPC events (`summary-prefetch-progress`) remain unchanged.

### Impact  
- **Performance** – concurrent prefetching can reduce total runtime on multi‑core systems.  
- **Correctness** – abort now stops all workers cleanly; no new jobs start after abort.  
- **Maintainability** – clearer separation of job dispatch logic; easier to adjust concurrency.  
- **Observability** – progress events remain the same; no change in external behavior.  
- **Compatibility** – no API changes; only internal implementation differs.

### Risks & follow‑ups  
- **Race safety** – `nextIndex++` is safe in Node’s single‑threaded event loop, but confirm no hidden race conditions.  
- **Worker exit** – verify that `return` after a non‑text error does not prematurely terminate the entire worker pool.  
- **Abort mid‑run** – test that aborting while a worker is processing a job stops subsequent workers as intended.  
- **Env var parsing** – ensure that invalid or unset `NOVADIFF_PREFETCH_CONCURRENCY` falls back to the default (3) without throwing.
