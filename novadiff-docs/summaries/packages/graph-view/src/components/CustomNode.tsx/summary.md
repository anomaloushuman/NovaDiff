### Overview  
A new `CustomNode` component is added to `packages/graph-view/src/components/CustomNode.tsx`. It renders a custom node for XYFlow with color bars, handles, and diff/selection overlays.

### Key changes  
- **Imports** (lines 1‑5): `memo` from `react`; `Handle`, `Position` from `@xyflow/react`; type imports for `NodeProps`, `Node`, `NodeType`; `useI18n` from context.  
- **Color maps** (lines 8‑30 and 32‑54) keyed by `NodeType` to keep styling consistent with the core union.  
- **Data contract** (`CustomNodeData`, lines 62‑80) defines node metadata and UI flags.  
- **Node type alias** (`CustomFlowNode`, line 82) registers the `"custom"` node with XYFlow.  
- **Component logic** (`CustomNodeComponent`, lines 84‑187) renders the card, applies classes based on flags, and uses `useI18n` for labels.  
- **Memoization** (line 189) wraps the component with `memo` to avoid unnecessary re‑renders.  
- **Export** (line 190) exposes `CustomNode` as the default export.

### Impact  
- Provides type safety for node data via `CustomNodeData`.  
- Emits a dev‑time warning for unknown `nodeType` values (lines 94‑96).  
- Diff overlay classes (`diff-changed-glow`, `diff-affected-glow`) give visual cues for changes.  
- Memoization improves rendering performance for unchanged nodes.

### Risks & follow‑ups  
- Color maps must stay in sync with the core `NodeType` union; update after core changes.  
- Unknown `nodeType` values trigger a warning; consider stricter validation or a fallback.  
- i18n keys `t.customNode.tested` and `t.customNode.hasTests` must exist; run extraction to confirm.  
- No unit tests exist for this component yet; add snapshot and interaction tests to guard against regressions.
