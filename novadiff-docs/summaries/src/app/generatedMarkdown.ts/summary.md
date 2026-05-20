### Overview  
A new module `src/app/generatedMarkdown.ts` was added. It exports a single function, `normalizeGeneratedMarkdown`, that cleans up markdown before rendering.

### Key changes  
- **`normalizeGeneratedMarkdown`** (lines 141‑150)  
  * Sanitizes malformed fences (`normalizeMalformedCodeFences`).  
  * Splits the source on fenced code blocks and applies either `normalizeFenceChunk` or `normalizeMarkdownChunk`.  

- **`normalizeFenceChunk`** (lines 52‑68)  
  * Trims fence bodies.  
  * Detects raw diff dumps via `looksLikeRawDiffDump` (lines 38‑51) and replaces them with the placeholder  
    `_Raw diff excerpt omitted from saved summary._`.  

- **`normalizeMarkdownChunk`** (lines 126‑138)  
  * Promotes known headings (`promoteKnownHeadings`, lines 78‑104).  
  * Normalizes compact list markers (`normalizeCompactListMarkers`, lines 69‑76).  
  * Splits dense paragraphs when the block exceeds 560 characters.  

- **`promoteKnownHeadings`** (lines 78‑104) ensures that headings from the `KNOWN_SECTION_HEADINGS` array are consistently formatted and spaced.  

- **`normalizeCompactListMarkers`** (lines 69‑76) rewrites list markers to avoid accidental heading promotion.  

- **`looksLikeRawDiffDump`** (lines 38‑51) heuristically detects diff‑style text to avoid leaking raw diffs in summaries.

### Impact  
- Centralizes markdown cleanup logic; no existing exports are altered.  
- Adds a placeholder for raw diff excerpts, reducing accidental leakage of diff content.

### Risks & follow‑ups  
- **Regex over‑matching**: Verify that `normalizeCompactListMarkers` and `promoteKnownHeadings` do not unintentionally modify legitimate content, especially nested headings or list markers.  
- **Diff detection false positives**: Test `looksLikeRawDiffDump` against non‑diff markdown containing similar numeric patterns.  
- **Integration testing**: Ensure downstream rendering pipelines still produce the expected output after normalization.
