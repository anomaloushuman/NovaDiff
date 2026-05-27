### Overview  
`src/app/types.ts` now exports three new security‑related types.  
They are added at lines 173‑187 and do not modify any existing logic.

### Key changes  
- **`SecurityScanSourceState`** (line 173) – a string literal union:  
  `"ok" | "warning" | "error" | "skipped"`.  
- **`SecurityScanSourceStatus`** (lines 175‑180) – an interface with:  
  `source: string; state: SecurityScanSourceState; message: string;`  
  and an optional `durationMs?: number`.  
- **`SecurityInsightReport`** (lines 182‑186) – an interface that aggregates:  
  `scannedAt: string; signals: RiskSignal[]; sources: SecurityScanSourceStatus[]`.

### Impact  
- The public type surface now includes the three new exports.  
- No executable code is added, so existing runtime behavior is unchanged.  
- Compile‑time effects are unknown from the available diff.

### Risks & follow‑ups  
- Check for unused imports of the new types to avoid lint warnings.  
- Add unit tests that build `SecurityInsightReport` objects to confirm type safety.  
- Update any documentation or API references to include the new types.
