### Overview  
`packages/graph-view/src/components/LearnPanel.tsx` (added lines R1‑R230) introduces a new React component that renders a guided tour UI. It pulls tour data from the global dashboard store and uses the i18n context for all displayed strings.

### Key changes  
- **Imports** – added at the top of the file (lines 1‑4):  
  ```ts
  import { useMemo } from "react";
  import ReactMarkdown from "react-markdown";
  import { useDashboardStore } from "../store";
  import { useI18n } from "../contexts/I18nContext";
  ```
- **Export** – the component is exported as the default surface (line 6).  
- **State extraction** – selectors wired to the store (lines 7‑16): `graph`, `tourActive`, `currentTourStep`, `startTour`, `stopTour`, `setTourStep`, `nextTourStep`, `prevTourStep`, `selectNode`, and the i18n hook `t`.  
- **Tour logic** – `useMemo` builds a sorted `tourSteps` array (lines 18‑21). Conditional rendering handles three states:  
  1. No tour (`!hasTour`, lines 24‑36).  
  2. Tour available but not started (`!tourActive`, lines 39‑74).  
  3. Tour active (lines 77‑229).  
- **Markdown rendering** – `ReactMarkdown` is configured with custom components for paragraphs, strong, code blocks, and lists (lines 121‑154).  
- **UI elements** – progress bar, navigation dots, prev/next buttons, language lesson, and referenced component pills are rendered with Tailwind classes (lines 86‑228).

### Impact  
- The component centralizes tour state in the dashboard store, keeping state logic in one place.  
- `useMemo` limits recomputation of the sorted steps array.  
- All UI strings are sourced from the i18n context, enabling localization.  
- No existing modules are modified; the new file is isolated.

### Risks & follow‑ups  
- **Store contract** – it is unknown from the diff whether the store actually contains the keys (`graph.tour`, `tourActive`, etc.); missing keys could result in `undefined` values.  
- **Markdown edge cases** – unknown from the diff whether `ReactMarkdown` will correctly render all expected syntax; test with code blocks and nested lists.  
- **Localization** – unknown from the diff whether all `t.learnPanel.*` keys exist; missing translations will show empty strings.  
- **Accessibility** – unknown from the diff whether additional ARIA attributes are needed beyond the existing `aria-label` on navigation dots.
