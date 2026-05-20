### Overview  
A new module `src/app/docsQuality.ts` adds utilities for creating markdown summaries, prompt contexts, and confidence badges that feed into release‑overview documents.

### Key changes  
- **Imports** – pulls `EvidenceBadge`, `FileChange`, `RiskSignal`, `SelectionIndexEntry`, and `SummaryIndexEntry` from `./types`.  
- **Helpers** – `uniqStrings` (lines 9‑21) removes duplicates and limits results; `compactText` (lines 24‑30) normalises and truncates long strings.  
- **Anchor generator** – `relPathAnchorId` (lines 32‑38) turns a relative path into a slug suitable for markdown anchors.  
- **Prompt context builders** –  
  - `buildSummaryPromptContext` (lines 41‑58) formats up to ten summary entries for LLM prompts.  
  - `buildRiskPromptContext` (lines 59‑74) formats up to fourteen risk signals.  
- **Badge derivation** – `deriveConfidenceBadges` (lines 75‑142) produces evidence‑backed badges based on summary coverage, risk severity, and selection docs.  
- **Markdown generator** – `buildReleaseOverviewMarkdown` (lines 143‑247) assembles a full release‑overview document, including tables of signals, confidence badges, top files, risk lists, and summary rollups.

### Impact  
- Exposes a new public API; consumers must import the correct types.  
- Centralises markdown logic, reducing duplication across the codebase.  
- Operations run linearly over input arrays, suitable for typical dataset sizes.  
- No breaking changes to existing modules; only new exports are added.

### Risks & follow‑ups  
- **Testing** – verify helper functions handle edge cases (empty arrays, very long strings).  
- **Type alignment** – ensure `EvidenceBadge` and related types are exported from `./types` and match the expected shape.  
- **Markdown rendering** – confirm that the generated markdown displays correctly in downstream tools such as GitHub PR comments.  
- **Integration** – callers of `buildReleaseOverviewMarkdown` must provide all required arguments; missing data could trigger runtime errors.
