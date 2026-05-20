### Overview  
A new component `SelectedDiffSummaryModal` is added in `src/components/SelectedDiffSummaryModal.tsx`. It renders a modal overlay that displays a summary of selected lines, a loading indicator, and error messages.

### Key changes  
- **Imports** (lines 1‑3):  
  ```ts
  import { X } from "lucide-react";
  import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";
  import { AnimatedOverlay } from "./ui/AnimatedOverlay";
  ```
- **Props interface** (lines 5‑12):  
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
- **Component export** (lines 14‑63): consumes the props and composes the UI.  
- **UI structure**: uses `AnimatedOverlay` with `backdropClassName="summary-modal-backdrop"` and `panelClassName="summary-modal"`. The header contains a close button (`<X size={18} aria-hidden />`) and an optional label. The body conditionally shows:
  - a spinner when `loading && !summary?.trim()`;
  - the summary via `<LlmSummaryMarkdown source={summary} />` when `summary` is present;
  - a caret (`▍`) when `loading && summary?.trim()`.

### Impact  
- The modal explicitly handles open, loading, error, and summary states, centralizing the logic for this UI element.  
- Conditional rendering avoids rendering unnecessary DOM nodes during loading or error states.  
- No existing components are modified; only new imports and CSS class names (`summary-modal-*`) are introduced.

### Risks & follow‑ups  
- **Dependencies**: `lucide-react`, `LlmSummaryMarkdown`, and `AnimatedOverlay` must be installed and exported correctly.  
- **Styles**: CSS classes such as `summary-modal-backdrop`, `summary-modal`, `summary-modal-header`, etc., must exist to ensure proper layout.  
- **Prop usage**: All props are required by the interface; callers must provide them to avoid TypeScript errors.  
- **Testing**: Unit tests should cover the loading, error, and summary rendering paths, and confirm that clicking the close button triggers `onClose`.
