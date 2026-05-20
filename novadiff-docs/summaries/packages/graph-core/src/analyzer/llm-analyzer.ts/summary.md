### Overview  
A new module `packages/graph-core/src/analyzer/llm-analyzer.ts` is added. It defines typed interfaces and helper functions for generating LLM prompts and parsing their JSON responses for both file‑level and project‑level analysis.

### Key changes  
- **Interfaces**  
  - `LLMFileAnalysis` (lines 1‑9) – shape for file analysis.  
  - `LLMProjectSummary` (lines 10‑18) – shape for project summaries.  
- **Prompt builders**  
  - `buildFileAnalysisPrompt` (lines 19‑42) – includes file content, project context, and requires a JSON response.  
  - `buildProjectSummaryPrompt` (lines 48‑75) – lists all files, optional sample snippets, and demands a JSON object.  
- **JSON extraction**  
  - `extractJson` (lines 81‑95) – removes markdown fences or raw JSON blocks.  
- **Response parsers**  
  - `parseFileAnalysisResponse` (lines 102‑143) – validates fields, normalizes `complexity` using `VALID_COMPLEXITIES` (line 97), returns `null` on failure.  
  - `parseProjectSummaryResponse` (lines 148‑186) – validates description, frameworks, and layers with a type guard; returns `null` on failure.

### Impact  
- Typed contracts and defensive parsing reduce runtime errors from malformed LLM output.  
- Centralized prompt logic simplifies future adjustments; interfaces keep the shape explicit.  
- No existing exports are modified; current consumers remain unaffected.  
- No new dependencies; operations are lightweight string manipulations.

### Risks & follow‑ups  
- `extractJson` may fail if the response lacks fences or contains extraneous text – test with varied LLM outputs.  
- `VALID_COMPLEXITIES` covers only “simple”, “moderate”, “complex”; consider a fallback for unexpected values.  
- Layer filtering in `parseProjectSummaryResponse` relies on a type guard – test with malformed layer objects to confirm graceful degradation.  
- Run lint, unit tests, and the production build to catch any type mismatches introduced by the new interfaces.
