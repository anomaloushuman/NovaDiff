### Overview  
A new file `src/app/diffExcerpt.ts` (R1‑R70) adds utilities for creating compact diff excerpts suitable for LLM context. It imports `FileDiffPayload` (R1) and defines constants for chunk sizing (R7‑R8).

### Key changes  
- **Constants**  
  - `FILE_SUMMARY_DIFF_CHUNK_CHARS = 48_000` (R7)  
  - `FILE_SUMMARY_MAX_CHUNKS = 8` (R8)  
- **Helper** `formatDiffRowLine` (R10‑R12) formats a diff row into a tab‑separated string, truncating each side to 160 characters.  
- **`buildDiffExcerpt`** (R15‑R35) builds a single excerpt up to `maxLen` (default 24 000), stopping early when the limit is reached.  
- **`buildDiffExcerptChunks`** (R41‑R70) splits the full diff into multiple chunks, each ≤ `maxLenPerChunk` (default `FILE_SUMMARY_DIFF_CHUNK_CHARS`) and limited by `maxChunks` (default `FILE_SUMMARY_MAX_CHUNKS`). It calculates an effective max length that balances total size and chunk count.

### Impact  
- Functions guard against `null` payloads and empty rows, returning `undefined` or an empty array as appropriate.  
- Centralizes diff formatting logic; constants make tuning easier.  
- Uses simple loops and string concatenation; chunking logic avoids building excessively large strings.  
- No existing modules are modified; the new API is additive and backward‑compatible.

### Risks & follow‑ups  
- **Edge cases**: unknown from the available diff/scan evidence whether `maxLen` or `maxLenPerChunk` correctly truncate when a single line exceeds the limit.  
- **Chunking logic**: unknown whether `effectiveMaxLen` behaves as intended when `maxChunks` is zero or negative.  
- **Truncation**: unknown if `formatDiffRowLine`’s 160‑char slice cuts off multi‑byte characters unexpectedly.  
- **Testing**: unknown if unit tests exist; consider adding tests for typical and boundary scenarios.
