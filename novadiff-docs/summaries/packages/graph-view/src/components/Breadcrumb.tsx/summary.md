### Overview
A new `Breadcrumb` component is added at `packages/graph-view/src/components/Breadcrumb.tsx` (lines R1‑R40). It reads navigation state from the global store and renders a breadcrumb UI that adapts to the current view (overview or layer detail).

### Key changes
- **Imports**  
  - `useDashboardStore` from `../store` [R1]  
  - `useI18n` from `../contexts/I18nContext` [R2]  
- **Export**  
  - `export default function Breadcrumb()` [R4]  
- **State hooks**  
  - `navigationLevel`, `activeLayerId`, `graph`, `navigateToOverview` from the store [R5‑R8]  
  - `t` from the i18n context [R9]  
- **Rendering logic**  
  - When `navigationLevel === "overview"` a pill shows `t.breadcrumb.projectOverview` [R15‑R18]  
  - When `navigationLevel === "layer-detail"` a breadcrumb chain shows:  
    - Project button (calls `navigateToOverview`) [R22‑R28]  
    - Separator `›` [R29]  
    - Active layer name or default `t.layer.defaultName` [R30‑R32]  
    - Escape‑back hint `t.breadcrumb.escBack` [R33‑R35]  
- **Styling** – Tailwind classes for positioning, colors, and typography.

### Impact
- **Correctness** – The component expects the store to expose `navigationLevel`, `activeLayerId`, `graph`, and `navigateToOverview`. If any are missing, the UI may render empty or throw errors.  
- **Maintainability** – Adds a public component that should be documented and exported from the package index. Future changes to store keys or i18n keys must be reflected.  
- **Performance** – Minimal; only a few store reads and a simple render tree.  
- **Compatibility** – Requires the `I18nContext` provider and the `useDashboardStore` hook to be available in the consuming app.

### Risks & follow‑ups
- **Store contract** – Verify that `useDashboardStore` provides the expected keys and that `navigateToOverview` is a function.  
- **i18n keys** – Ensure `t.breadcrumb.projectOverview`, `t.breadcrumb.project`, `t.layer.defaultName`, and `t.breadcrumb.escBack` exist; otherwise the UI will show empty strings.  
- **Graph safety** – The code safely handles `graph` being `undefined`, but `graph?.layers` must be an array; otherwise `find` will error.  
- **Testing** – Add unit tests for both navigation levels, mocking the store and i18n context.  
- **Export** – Confirm the component is re‑exported from the package’s index file so it can be imported elsewhere.
