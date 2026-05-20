### Overview  
`src/components/InsightsColumn.tsx` introduces a new `InsightsColumn` component that renders a two‑tab interface: **Summary** and **Files**. It displays LLM‑generated file summaries, diff statistics, and a tree of changed files. A small helper `MetricPill` is defined for metric display.

### Key changes  
- **Imports** (lines 1‑6):  
  ```ts
  import type { FileChange, FileDiffPayload } from "../app/types";
  import type { LlmSettings } from "../app/llmStorage";
  import { isNovadiffDocsReservedPath } from "../app/novadiffPaths";
  import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";
  import { ChangedFilesTree } from "./ChangedFilesTree";
  import { Check, LayoutList, Loader2, Sparkles } from "lucide-react";
  ```
- **`InsightsColumnProps`** (lines 10‑29): 28 properties covering tab state, file list, selection, diff payload, LLM settings, summary state, prefetch status, and callbacks.
- **UI logic** (lines 31‑290):  
  - Tab switching via `onTab`.  
  - **Summary tab**: shows an overview paragraph, a key‑changes list, a button to request a file summary, a prefetch progress bar, the rendered Markdown summary, and diff statistics with confidence badges.  
  - **Files tab**: renders `<ChangedFilesTree rows={rows} … />`.  
- **`MetricPill`** (lines 293‑308): renders a label/value/tone pill.

### Impact  
- **Build**: Requires `lucide-react` and the LLM components (`LlmSummaryMarkdown`, `ChangedFilesTree`).  
- **Type safety**: All props are required; missing values will cause compile errors.  
- **Runtime**: The summary button is disabled when no file is selected, the path is reserved, the file count is zero, the summary is loading, or the LLM API is unavailable (`window.electronAPI`).  
- **Performance**: Rendering the full file tree and summary can be heavy for large diffs; the progress bar provides visual feedback.

### Risks & follow‑ups  
- Verify that consumers supply `llmSettings` and `diffPayload`; otherwise the component will fail to render.  
- Ensure `lucide-react` is installed to avoid build failures.  
- Confirm that the UI degrades gracefully when `window.electronAPI` is missing.
