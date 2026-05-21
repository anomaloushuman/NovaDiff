### Overview  
`src/app/commitMessage.ts` now accepts an options object, adds classification helpers, and includes a district‑level breakdown in the LLM prompt. Two utilities from `./commitChangeAnalysis` are re‑exported for external use.

### Key changes  
- **Imports** (`R3‑8`): added `classifyCompareRows`, `districtBreakdown`, `graphSymbolsContext`, and `UpdateDecision`.  
- **New interface** (`R12‑17`): `CommitMessageContextOptions` with optional `classification`, `graphContext`, and `githubContext`.  
- **Function signature** (`R26`): `buildCommitMessageContext` now takes `options: CommitMessageContextOptions = {}`.  
- **Classification logic** (`R28‑29`): uses `options.classification ?? classifyCompareRows(docRows)` to set `classification`.  
- **District breakdown** (`L21 / R36‑40`): inserts a “By district” section listing up to 24 top‑level folders.  
- **Context injection** (`R42‑51`): appends optional `graphContext` and trimmed `githubContext` when provided.  
- **Export** (`R67‑68`): re‑exports `graphSymbolsContext` and `classifyCompareRows`.  
- **No change** to `parseCommitMessageOutput` (lines 69‑96 remain unchanged).

### Impact  
- **Backward compatibility**: default options preserve existing behavior; callers may supply richer context without breaking.  
- **API surface**: `buildCommitMessageContext` now exposes an options parameter and the file re‑exports expose helper utilities.  
- **Prompt content**: added sections (classification, district breakdown, optional contexts) may increase prompt length but provide more detail for LLMs.

### Risks & follow‑ups  
- Verify that `classifyCompareRows` and `districtBreakdown` handle empty `docRows` without throwing.  
- Ensure the `githubContext` trimming (`slice(0, 2000)`) does not truncate essential URLs.  
- Run the existing test suite to confirm that added sections do not affect downstream parsing logic.  
- Monitor LLM output quality after the new context is introduced; the added “By district” section may influence prompt length limits.
