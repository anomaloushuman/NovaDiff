### Overview  
A new component `SelectedDiffSummaryModal` is added at `src/components/SelectedDiffSummaryModal.tsx`. It renders a modal overlay that displays LLM‑generated documentation for a selected code range, with loading, error handling, and a close button.

### Key changes  
- **Imports** (lines 1‑3):  
  ```ts
  import { X } from "lucide-react";
  import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";
  import { AnimatedOverlay } from "./ui/AnimatedOverlay";
  ```
- **Props interface** (`SelectedDiffSummaryModalProps`, lines 5‑12):  
  ```ts
  export interface SelectedDiffSummaryModalProps {
    open: boolean;
    label: string | null;
    summary: string | null;
    loading: boolean;
    error: string | null;
    onClose: () => void;
  }
  ```
- **Component** (`SelectedDiffSummaryModal`, lines 14‑63): renders an `AnimatedOverlay` with custom classes, a header containing a title, optional kicker (`label`), and a close button using the `X` icon. The body shows an error paragraph if `error` is set, a loading spinner when `loading` is true and no trimmed `summary`, the `LlmSummaryMarkdown` component when `summary` exists, and a caret animation while streaming (`loading && summary?.trim()`).

### Impact  
- **UI**: Provides a reusable modal for LLM summaries, giving users visual feedback during analysis.  
- **State handling**: Centralizes loading, error, and summary rendering logic, reducing duplication.  
- **Accessibility**: Uses `aria-label` on the close button and `aria-hidden` on decorative elements.  
- **Performance**: Conditional rendering limits unnecessary DOM updates; the spinner appears only when needed.

### Risks & follow‑ups  
- **Missing CSS**: The classes `summary-modal-backdrop`, `summary-modal`, and related styles must exist; otherwise the overlay may break layout.  
- **Icon import**: `lucide-react` must be installed and export `X`; a missing dependency will cause a build error.  
- **Markdown rendering**: It is unknown from the diff whether `LlmSummaryMarkdown` sanitizes input; if not, XSS could be introduced.  
- **Prop validation**: No runtime checks are present; passing undefined props may lead to unexpected UI states.
