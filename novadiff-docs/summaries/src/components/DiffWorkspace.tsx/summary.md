### Overview  
A new `DiffWorkspace` component is added in `src/components/DiffWorkspace.tsx`.  
It renders a full diff UI, handles selection of diff rows, and shows a modal for documenting the selected rows.

### Key changes  
- **Imports** (lines 1‑16) add `MouseEvent` from `react`, types `DiffRow`, `FileDiffPayload`, `SelectionDocMode` from `../app/types`, the helper `pathDisplayLabel` from `../app/pathDisplay`, icons from `lucide-react`, and the modal component `SelectedDiffSummaryModal`.  
- **`DiffWorkspaceProps` interface** (lines 18‑58) lists all props required by the workspace, including callbacks for browsing, swapping, comparing, and selection logic.  
- **`DiffWorkspace` function** (lines 60‑370) builds the UI: path selectors, compare button, busy/compare status banner, file statistics, selected‑path bar, diff panes, and the diff table rendered with `DiffTableRow`.  
- **`DiffTableRow` helper** (lines 371‑400) renders a single diff row, applies styles, and handles click selection.  
- **Modal integration** (lines 353‑360) mounts `SelectedDiffSummaryModal` with props for open state, label, summary, loading, error, and close handler.

### Impact  
- The component must be wired into the app’s routing or parent component; missing props will cause runtime errors.  
- It centralizes diff‑related UI logic, making future changes to selection or modal behavior easier to maintain.  
- Rendering many diff rows may affect scroll performance; consider virtualization if tests show slowdown.  
- The component depends on existing exports: `SelectedDiffSummaryModal` and the types from `../app/types`.

### Risks & follow‑ups  
- **Import failures**: Verify that `../app/types` exports `DiffRow`, `FileDiffPayload`, and `SelectionDocMode`.  
- **Modal contract**: Ensure `SelectedDiffSummaryModal` accepts the props used; mismatches will break the modal.  
- **Event handling**: `onSelectDiffRow` expects a `MouseEvent`; callers must pass the correct event type.  
- **Styling**: CSS classes such as `diff-row-selected` and `diff-row-muted` must be defined; otherwise rows will appear unstyled.
