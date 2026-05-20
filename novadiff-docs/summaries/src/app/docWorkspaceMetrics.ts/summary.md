### Overview  
`src/app/docWorkspaceMetrics.ts` is a new module that aggregates file‑change statistics and formats them for LLM prompts, Markdown reports, and Mermaid visualizations. The file adds imports, interfaces, helper functions, and several public utilities.

### Key changes  
- **Imports** – `import type { ChangeKind, FileChange } from "./types";` (R1).  
- **Interfaces** – `ExtensionCount` (R3‑R6) and `DocWorkspaceMetrics` (R8‑R17) describe metric shapes.  
- **Helpers** – `fileExtension` (R21‑R29) and `firstSegment` (R31‑R35) extract extensions and top‑level path segments.  
- **Metric builder** – `buildDocWorkspaceMetrics` (R37‑R85) tallies counts by kind, extension, depth, and root, caps sample paths at 120, and returns a `DocWorkspaceMetrics` object.  
- **Prompt formatter** – `metricsToPromptContext` (R93‑R143) produces a structured prompt string, optionally including gitignore stats and a code‑base outline.  
- **Markdown generator** – `buildCompareMetricsMarkdown` (R146‑R172) outputs a table of added/removed/modified counts and a sample list of changed paths.  
- **Mermaid visualizers** – `changeKindPieMermaid` (R175‑R185) and `depthBarMermaid` (R188‑R204) emit Mermaid syntax for pie and bar charts of change kinds and path depth.

### Impact  
- **Performance** – All new functions process `rows` in a single pass, giving O(n) time and O(k) space where *k* is the number of distinct extensions, depths, or roots.  
- **API surface** – The module exports only the new interfaces and functions; existing imports remain unchanged.  
- **Observability** – Generated Markdown and Mermaid strings can be logged or displayed in UI components, aiding diff‑report debugging.

### Risks & follow‑ups  
- **Type alignment** – Verify that `ChangeKind` and `FileChange` in `./types` expose `kind` and `path` as expected.  
- **Sample cap** – `SAMPLE_CAP` is hard‑coded to 120; assess if this suffices for typical workloads.  
- **Gitignore handling** – `metricsToPromptContext` includes a gitignore line only when `gitignore.skippedGitignore > 0`; ensure callers supply a non‑null object when relevant.  
- **Mermaid syntax** – The output uses Mermaid v9+ features (`xychart-beta`); test rendering in the target environment to avoid runtime errors.
