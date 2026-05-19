### Overview
A new `NodeTooltip.tsx` component is added to `packages/graph-view/src/components/`. It renders a floating tooltip that follows the mouse over a node, displaying node metadata, connection counts, and optional tags.

### Key changes
- Imports added: `useEffect`, `useState` from React and `CustomNodeData` from `./CustomNode` [R1‑2].
- `NodeTooltipProps` interface defined with `data`, `nodeId`, `incomingCount`, `outgoingCount`, optional `tags` [R4‑9].
- Component exported as default function `NodeTooltip` [R12].
- State: `position` and `visible` via `useState` [R19‑20].
- `useEffect` attaches `mouseenter`, `mouseleave`, `mousemove` listeners to `[data-id="${CSS.escape(nodeId)}"]` and cleans them up on unmount [R22‑44].
- Tooltip rendered only when `visible` is true; positioned at `position.x + 16`, `position.y + 16` [R46‑56].
- Content includes node type, complexity, label, incoming/outgoing counts, total connections, summary (truncated to 120 chars), and up to three tags with a “+N” indicator for excess tags [R58‑120].

### Impact
- Tooltip appears only on hover and follows mouse movement.
- Adds three event listeners per node; no external side effects.
- Requires that nodes rendered by React Flow expose a `data-id` attribute matching `nodeId`.
- Uses `CSS.escape`; behavior in browsers lacking support is unknown from the diff.

### Risks & follow‑ups
- Verify that every node has a matching `data-id`; otherwise the tooltip will not attach.
- Confirm that `CustomNodeData` contains the fields accessed (`nodeType`, `complexity`, `label`, `summary`).
- Test in environments without `CSS.escape` to ensure graceful degradation.
- Ensure the tooltip does not interfere with other mouse events or accessibility features.
