### Overview
`electron/diff-excerpt.cjs` is a new CommonJS module that exports two helper functions for creating compact diff excerpts. The module is added to the Electron build and mirrors the logic of `src/app/diffExcerpt.ts`.

### Key changes
- **`buildDiffExcerpt(payload, maxLen = 24000)`** (lines 12‑28) iterates over `payload.rows`, builds tab‑separated lines, stops when the accumulated length exceeds `maxLen`, and returns the string or `undefined`.  
- **`buildDiffExcerptChunks(payload, maxLenPerChunk = FILE_SUMMARY_DIFF_CHUNK_CHARS, maxChunks = FILE_SUMMARY_MAX_CHUNKS)`** (lines 36‑67) pre‑computes lines, calculates an effective max length based on total length and `maxChunks`, then splits into chunks.  
- Constants **`FILE_SUMMARY_DIFF_CHUNK_CHARS = 48000`** and **`FILE_SUMMARY_MAX_CHUNKS = 8`** (lines 3‑4) set default chunk size and maximum number of chunks.  
- Exports both functions via `module.exports` (line 70).  
- Uses strict mode (line 1) and JSDoc comments that match the TypeScript source (lines 6‑11).

### Impact
- Provides an Electron‑friendly diff excerpt generator that matches the existing TypeScript API.  
- Chunking logic limits memory usage for large diffs, keeping each chunk ≤ 48 k characters or fewer.  
- The module performs only string manipulation, so it has no side effects and is safe for UI‑thread usage.  
- Configurable `maxLen` and `maxLenPerChunk` allow adaptation to LLM context size constraints.

### Risks & follow‑ups
- **Payload shape**: missing `left_no`, `right_no`, or `left_style` may produce empty strings; verify data integrity.  
- **Boundary values**: test edge cases near 24 k and 48 k to ensure correct truncation and chunking.  
- **Interop**: confirm that Electron code correctly requires this CommonJS module; missing `module.exports` could break imports.  
- **Build validation**: run lint, unit tests, and production build to catch any CommonJS/ESM interop issues.
