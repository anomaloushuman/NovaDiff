### Overview
Adds a new `ContainerNode` component in `packages/graph-view/src/components/ContainerNode.tsx` for rendering container nodes.

### Key changes
- Imports added at lines 1‑3: `memo` from `react`, `NodeProps, Node` from `@xyflow/react`, and `getLayerColor` from `./LayerLegend`.
- Interface `ContainerNodeData` defined at lines 5‑17, extending `Record<string, unknown>` and including fields such as `containerId`, `name`, `childCount`, `strategy`, `colorIndex`, `isExpanded`, `hasSearchHits`, `searchHitCount?`, `isDiffAffected`, `isFocusedViaChild`, `onToggle`.
- Type alias `ContainerFlowNode` declared at line 19 as `Node<ContainerNodeData, "container">`.
- Functional component `ContainerNodeComponent` implemented at lines 21‑98. It renders a div styled as a button, displays the container name, child count, and optional search hit badge, and handles click and key‑down events to toggle expansion via `data.onToggle`.
- Component memoized with `React.memo` at line 100 and given `displayName = "ContainerNode"`.
- Default export of the memoized component at line 103.

### Impact
- Provides a typed representation of container node data, enabling compile‑time checks for consumers of `ContainerFlowNode`.
- Centralizes rendering logic for container nodes, reducing duplication across the graph view.
- Memoization may reduce re‑renders when props are unchanged, though performance impact is not quantified in the diff.

### Risks & follow‑ups
- Existing code that renders container nodes must import and use `ContainerFlowNode`; missing fields may cause runtime errors.
- The new component’s ARIA attributes and keyboard handling are added, but accessibility behavior should be verified in the target browsers.
- Styling changes (border, background) could interact with theme overrides; visual regression tests are recommended.
