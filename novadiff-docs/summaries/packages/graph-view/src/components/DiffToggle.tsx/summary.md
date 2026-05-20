### Overview  
`packages/graph-view/src/components/DiffToggle.tsx` (lines R1‑66) introduces a new component that toggles a diff overlay and displays counts of changed and affected nodes.

### Key changes  
- **Imports**  
  - `useDashboardStore` from `../store` (R1)  
  - `useI18n` from `../contexts/I18nContext` (R2)  
- **Export**  
  - `export default function DiffToggle()` (R4)  
- **Store hooks**  
  - `diffMode`, `toggleDiffMode`, `changedNodeIds`, `affectedNodeIds` (R5‑R8)  
- **i18n**  
  - `t` from `useI18n()` used for button titles and labels (`diffToggle.*` keys) (R9‑R30)  
- **Button behavior**  
  - Disabled when `changedNodeIds.size === 0` (R16‑R18)  
  - Title switches between `hideOverlay`, `showOverlay`, and `noData` based on `diffMode` and data presence (R25‑R31)  
- **Conditional stats panel**  
  - Rendered when `diffMode && hasDiff` (R36‑R63)  
  - Shows colored indicators and counts for `changedNodeIds` and `affectedNodeIds` (R38‑R60)

### Impact  
- Adds a lightweight UI element; no existing components are altered.  
- Requires the dashboard store and i18n context to be present in the component tree.  
- Introduces translation keys `diffToggle.hideOverlay`, `diffToggle.showOverlay`, `diffToggle.noData`, `diffToggle.changed`, and `diffToggle.affected`.  
- Re‑renders only when the referenced store values change, so performance impact is minimal.

### Risks & follow‑ups  
- **Context availability** – Verify that `useDashboardStore` and `useI18n` providers wrap the component tree; otherwise runtime errors occur.  
- **Missing translations** – Ensure all `diffToggle.*` keys exist; otherwise raw keys will display.  
- **Button state** – Test that the button disables when `changedNodeIds.size === 0` and re‑enables after changes.  
- **Stats accuracy** – Confirm that `affectedNodeIds` is populated correctly; otherwise the displayed counts may be misleading.
