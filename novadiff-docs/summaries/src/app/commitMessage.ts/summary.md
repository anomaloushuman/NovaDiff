### Overview  
A new file `src/app/commitMessage.ts` adds two exported helpers:  
- `buildCommitMessageContext` (lines 7‑30) builds a concise diff summary for an LLM prompt.  
- `parseCommitMessageOutput` (lines 33‑59) extracts `SUBJECT:` and `BODY:` from an LLM reply, with fall‑backs.

### Key changes  
- Imports added: `DocWorkspaceMetrics` (line 1) and `FileChange` (line 2).  
- Constant `MAX_PATHS = 90` (line 4) limits the number of paths listed.  
- `buildCommitMessageContext` returns a string capped at 12 000 characters (line 29) and includes up to `MAX_PATHS` paths (lines 23‑27).  
- `parseCommitMessageOutput` normalises CRLF to LF, trims whitespace, and if `SUBJECT:` or `BODY:` are missing it falls back to the first non‑empty line or the remaining text (lines 37‑54). The returned `subject` is truncated to 100 characters and collapsed whitespace (line 56).

### Impact  
- The new helpers centralise prompt construction and parsing logic, keeping related code in one module.  
- Truncation limits prompt size, preventing excessively large inputs.  
- The parsing logic now tolerates missing headers, reducing runtime errors when the LLM omits them.

### Risks & follow‑ups  
- Verify that `DocWorkspaceMetrics` and `FileChange` types are exported correctly elsewhere.  
- The 12 000‑character limit may truncate important information in very large diffs; review with realistic diff sizes.  
- Run integration tests to confirm that `parseCommitMessageOutput` handles multiline bodies and absent headers as intended.  
- Ensure the new file is included in the build pipeline and that linting passes without new warnings.
