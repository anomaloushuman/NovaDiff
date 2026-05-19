### Overview  
A new `DiffToggle` component is added under `packages/graph-view/src/components`. It introduces a UI button to toggle diff overlay visibility, leveraging the dashboard store and i18n context.

### Key changes  
- **Imports added**: `useDashboardStore` from `../store` and `useI18n` from `../contexts/I18nContext`.  
- **State hooks**: `diffMode`, `toggleDiffMode`, `changedNodeIds`, and `affectedNodeIds` are extracted from the store.  
- **Computed flag**: `hasDiff` checks if any nodes have changed (`changedNodeIds.size > 0`).  
- **Button behavior**:  
  - `onClick` triggers `toggleDiffMode`.  
  - Disabled when `!hasDiff`.  
  - Dynamic classes and titles based on `diffMode` and `hasDiff`.  
- **Conditional rendering**: When diff is active and data exists, a legend shows counts of changed and affected nodes with color indicators.  
- **Export**: `export default function DiffToggle()` makes the component available for import elsewhere.

### Impact  
- **UI**: Adds a new toggle button; no existing components are modified.  
- **State**: Requires `diffMode`, `toggleDiffMode`, `changedNodeIds`, and `affectedNodeIds` to exist in the dashboard store; otherwise runtime errors.  
- **Internationalization**: Depends on `t.diffToggle.*` keys; missing keys will result in undefined strings.  
- **Styling**: Uses CSS variables (`--color-diff-changed`, `--color-diff-affected`); missing variables may break appearance.  
- **Performance**: Minimal; only a few store reads and a simple button render.

### Risks & follow-ups  
- Verify that the dashboard store exposes the required fields (`diffMode`, `toggleDiffMode`, `changedNodeIds`, `affectedNodeIds`).  
- Ensure i18n keys `diffToggle.hideOverlay`, `diffToggle.showOverlay`, `diffToggle.noData`, `diffToggle.changed`, and `diffToggle.affected` exist.  
- Confirm CSS variables for diff colors are defined in the theme; otherwise the legend will not display correctly.  
- Run unit tests for the new component to catch any missing dependencies or rendering issues.
