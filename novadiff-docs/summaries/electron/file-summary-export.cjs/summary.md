### Overview  
`electron/file-summary-export.cjs` is a new Electron module that writes and reads Markdown, HTML, and PDF summaries for file‑level and selection‑level diffs. It is added to the NovaDiff Electron side and exports four main functions plus `isReservedNovadiffRel`.

### Key changes  
* **Imports & setup** – `fs/promises`, `path`, `crypto`, `marked`, `htmlToPdfFile`, and `normalizeMarkdownDocument` are required (lines 3‑8). `marked.setOptions` is configured for GFM (line 10).  
* **Path handling** – `safeSummarySegments` (lines 55‑81) validates relative paths. `resolveSummaryDirAbs` (lines 90‑103), `resolveSelectionBaseDirAbs` (lines 114‑127), and `resolveSelectionDirAbs` (lines 130‑138) resolve directories, falling back to a SHA‑256 hash when paths are too long or invalid. `MAX_ABS` is set to 220 on Windows, 400 otherwise (line 84).  
* **Document builders** – `buildFileSummaryDocument` (lines 159‑216) and `buildSelectionSummaryDocument` (lines 217‑282) convert Markdown to HTML, inject Mermaid fences, and embed a script that signals PDF readiness.  
* **Export functions** – `exportFileSummaryArtifacts` (lines 294‑356) and `exportSelectionSummaryArtifacts` (lines 422‑490) write `summary.md`, `summary.html`, `summary.pdf`, and `meta.json`. PDF generation uses `htmlToPdfFile` (lines 344‑345, 478‑479) with `landscape: false`; any error is returned as `pdfWarning`.  
* **Read functions** – `readFileSummaryMarkdowns` (lines 365‑416) loads persisted file summaries, returning `badges` from `meta.summaryEvidence`.  
  `readSelectionSummaryMarkdowns` (lines 498‑572) loads all selection artifacts under a given `relPath`, returning `label`, `selectionKey`, `requestedMode`, `effectiveMode`, `lineRanges`, `symbol`, `generatedAt`, `markdown`, and `htmlRelPath`. Results are sorted by `relPath` and `generatedAt`.  
* **Exports** – The module exports `exportFileSummaryArtifacts`, `readFileSummaryMarkdowns`, `exportSelectionSummaryArtifacts`, `readSelectionSummaryMarkdowns`, and `isReservedNovadiffRel` (lines 574‑580).

### Impact  
* **Correctness** – Path validation prevents accidental overwrites of reserved or malformed paths.  
* **Maintainability** – Centralized path resolution and document building reduce duplication.  
* **Observability** – `meta.json` and `summary.md` provide audit trails; PDF errors surface via `pdfWarning`.  
* **Performance** –
