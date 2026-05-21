### Overview  
`HistoryCompareStrip` was refactored to improve the Git history comparison panel.  
Key UI changes include a new title markup, additional badges, a live‑head toggle, and updated class names that align with the design system.

### Key changes  
- **Title** – lines L71‑73 replaced plain text with  
  ```tsx
  <h1 className="git-history-title">
    Git history <span className="git-history-title-accent">compare</span>
  </h1>
  ```  
- **Wrapper** – line R79 added `git-history-compare-card` to the `workspace-setup-strip` container.  
- **Labels** – lines R83 and R90 added `git-history-field-label` to the Base/Head labels.  
- **Badges** – lines R85 and R92‑96 insert conditional `<span className="git-history-badge …">` elements next to the selectors.  
- **Selector segment** – line R137 added `git-history-selector-segment` to the segment class list.  
- **Live‑head input** – lines R145‑161 replace the head selector with an input + browse button when `useLiveHead` is true.  
- **Live toggle** – lines R180‑185 introduce a checkbox labeled “Compare base against live dev folder”.  
- **Compare button** – lines R190‑205 update the button’s classes, disabled state, and tooltip logic.

The logic that determines `canCompare` (lines 62‑66) remains unchanged.

### Impact  
- **UI consistency** – new class names (`git-history-compare-card`, `git-history-field-label`, etc.) match the existing design system.  
- **Accessibility** – added `aria-label` attributes and descriptive labels for interactive elements.  
- **No functional regression** – only presentation layers were altered.

### Risks & follow‑ups  
- **Missing CSS** – verify that the new classes exist in the stylesheet.  
- **Badge rendering** – ensure badges do not appear when `base` or `head` is null; run unit tests for edge cases.  
- **Live‑head toggle** – confirm that toggling updates `useLiveHead` correctly and that the input behaves as expected.  
- **Lint & build** – run `npm run lint`, `npm test`, and `npm run build` to catch any syntax or type errors introduced by the JSX changes.
