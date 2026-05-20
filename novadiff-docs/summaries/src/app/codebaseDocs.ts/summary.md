### Overview
A new module `src/app/codebaseDocs.ts` is added. It exports utilities that transform a `CodebaseOutline` into plain‑text prompts, Markdown reports, and Mermaid diagrams.

### Key changes
- **Import**: `import type { CodebaseOutline } from "./types";` (R1).  
- **File sampling**: `sampleFilePaths(outline, cap?)` (lines 3‑9, R3‑8).  
- **Symbol sampling**: `sampleSymbolLines(outline, cap?)` (lines 11‑32, R11‑31).  
- **Depth histogram**: `depthHistogram(outline)` (lines 34‑46, R34‑45).  
- **Prompt context**: `buildCodebasePromptContext(...)` (lines 48‑92, R48‑92).  
- **Markdown report**: `buildCodebaseMetricsMarkdown(...)` (lines 95‑154, R95‑154).  
- **Mermaid pie**: `codebaseExtensionPieMermaid(outline)` (lines 157‑166, R157‑166).  
- **Mermaid flowchart**: `codebaseDepthMermaid(outline)` (lines 169‑178, R169‑178).

All functions guard against missing fields with optional chaining and array checks, so they should not throw when `outline` lacks expected properties.

### Impact
- Only a new file is added; no existing files are modified.  
- The module exposes only the listed functions, keeping the public surface minimal.  
- Importing it in production code would add the generated strings to the bundle, but the functions themselves are lightweight.

### Risks & follow‑ups
- **Outline shape**: Verify that `CodebaseOutline` actually contains `by_extension`, `top_directories`, `detected_projects`, `import_edges`, `cross_file_call_edges`, and `symbol_spans_by_file` to avoid `undefined` values.  
- **Bundle size**: Ensure the module is imported only in tooling or dev environments to prevent unnecessary bundle growth.  
- **Mermaid rendering**: Test that the strings produced by `codebaseExtensionPieMermaid` and `codebaseDepthMermaid` render correctly in downstream viewers (e.g., VS Code preview, documentation sites).  
- **Runtime safety**: Run lint, tests, and the production build to confirm no TypeScript or runtime errors are introduced.
