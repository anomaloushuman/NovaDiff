### Overview  
A new utility `packages/graph-view/src/utils/elk-layout.ts` adds ELK‑specific types and a repair pipeline that sanitizes graph input before layout. The file imports `GraphIssue` from `@novadiff/graph-core/schema`, `loadElk` from `./elk-bundled`, and default node dimensions from `./layout` (lines 1‑3).

### Key changes  
- **Types** (`lines 5‑34`, `39‑43`, `214‑221`): `ElkChild`, `ElkEdge`, `ElkInput`, `RepairResult`, `ElkLayoutOptions`, `ElkLayoutResult`.  
- **Repair logic** (`repairElkInput`, `lines 56‑213`):  
  - Fills missing `width`/`height` with defaults.  
  - Deduplicates child IDs per parent.  
  - Drops orphan children, orphan edges, and containment cycles.  
  - Emits `GraphIssue` objects and may throw when `strict` is true.  
- **Layout wrapper** (`applyElkLayout`, `lines 223‑243`):  
  - Calls `repairElkInput`, loads ELK via `loadElk`, runs `elk.layout`, and returns the positioned graph plus any issues.  
  - On layout failure, returns a fatal `GraphIssue` unless `strict` is set.

### Impact  
- **Correctness**: Input is sanitized before ELK runs, reducing runtime errors.  
- **Observability**: Issues are surfaced as `GraphIssue` objects, aiding debugging.  
- **Compatibility**: Existing callers are unaffected; new functions are exported for optional use.

### Risks & follow‑ups  
- Verify that `loadElk` resolves correctly in all target environments; a missing bundle could silently fail.  
- Confirm that the `strict` flag propagates errors as intended.  
- Test edge cases: graphs with many duplicate IDs, deep containment cycles, and orphan references.  
- Monitor memory usage for large graphs; recursive traversal may be costly.
