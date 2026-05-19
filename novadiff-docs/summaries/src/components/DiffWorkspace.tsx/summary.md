### Overview  
`DiffWorkspace` now shows the selected‑diff documentation in a modal instead of an inline panel. The component’s props and rendering were extended to support this change.

### Key changes  
- **Imports** – `LlmSummaryMarkdown` was removed (L15) and `SelectedDiffSummaryModal` was added (R15).  
- **Props** – `DiffWorkspaceProps` gained optional `compareStatusMessage?: string | null` (R27), `selectedDiffSummaryModalOpen: boolean` (R55), and `onCloseSelectedDiffSummaryModal: () => void` (R56).  
- **Signature** – `DiffWorkspace` now accepts the new props (R59‑95).  
- **Activity banner** – displays `compareStatusMessage` or a default string (R199‑211).  
- **Modal** – `<SelectedDiffSummaryModal>` is rendered after the diff panes (R354‑362).  
- **Inline panel removed** – the `<section className="selected-diff-doc-panel">` block was deleted (L332‑340).

### Impact  
- The summary is now presented in a modal, allowing larger content without cluttering the main view.  
- Callers must provide `selectedDiffSummaryModalOpen` and `onCloseSelectedDiffSummaryModal`; otherwise the modal never opens.  
- `compareStatusMessage` gives clearer feedback during comparison, improving user awareness.  
- Existing props remain unchanged, so legacy code continues to work.

### Risks & follow‑ups  
- **Modal state** – Verify that callers manage `selectedDiffSummaryModalOpen` and the close callback.  
- **Layout** – Ensure the modal does not obscure the diff panes on small screens; visual regression tests are recommended.  
- **Prop leakage** – Confirm that `selectedDiffSummary` is no longer referenced elsewhere to avoid TypeScript errors.  
- **Performance** – The modal is always rendered; monitor its cost when the summary is large.
