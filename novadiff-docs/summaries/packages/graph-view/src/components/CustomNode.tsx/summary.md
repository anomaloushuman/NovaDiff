### Overview  
A new `CustomNode` component is added to `packages/graph-view/src/components/CustomNode.tsx`. It renders a node with a colored side bar, type label, complexity badge, optional test icon, and supports diff overlays, selection glow, and neighbor highlighting.

### Key changes  
- **Imports** (lines 1‑5): `memo` from React; `Handle`, `Position`, `NodeProps`, `Node` from `@xyflow/react`; `NodeType` from `@novadiff/graph-core/types`; `useI18n` from the local context.  
- **Color maps** (lines 7‑30, 32‑54, 56‑60): `typeColors`, `typeTextColors`, and `complexityColors` keyed by `NodeType` or complexity string.  
- **`CustomNodeData` interface** (lines 62‑80): defines node metadata, flags for selection, diff state, and an optional click callback.  
- **`CustomFlowNode` type** (line 82): `Node<CustomNodeData, "custom">`.  
- **`CustomNodeComponent`** (lines 84‑187): renders the node, applies dynamic classes for selection, diff, and neighbor states, and uses `Handle` for XYFlow connections.  
- **Memoization** (line 189): `const CustomNode = memo(CustomNodeComponent);`.  
- **Default export** (line 190): `export default CustomNode;`.

### Impact  
- The component now supports the `"custom"` node type with diff overlays and selection logic.  
- Centralized color maps and a dedicated interface simplify future style or data changes.  
- A dev‑mode warning (`console.warn`) flags unknown `nodeType` values, aiding debugging.

### Risks & follow‑ups  
- **Unknown `NodeType` values**: The dev‑mode warning may surface if the core union and the color map diverge; verify sync after core updates.  
- **Memoization**: Ensure that `data` props are stable; otherwise, memo may not prevent unnecessary renders.  
- **Diff overlay styling**: Confirm that CSS variables (`--color-diff-changed`, `--color-diff-affected`) exist in the theme.  
- **Test icon rendering**: Verify that `t.customNode.tested` and `t.customNode.hasTests` keys are present in the i18n bundle.
