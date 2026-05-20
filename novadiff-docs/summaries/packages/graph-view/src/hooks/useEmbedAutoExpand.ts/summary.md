### Overview  
A new hook, `useEmbedAutoExpand`, is added to `packages/graph-view/src/hooks/useEmbedAutoExpand.ts` (lines R42‑129). It expands folder containers and fits the viewport when a NovaDiff embed is active.

### Key changes  
- **Imports** (R1‑R4)  
  ```ts
  import { useEffect, useRef, useState } from "react";
  import { useReactFlow } from "@xyflow/react";
  import { useDashboardStore } from "../store";
  import { useNovaDiffEmbed } from "../contexts/NovaDiffEmbedContext";
  ```
- **Constants** (R6‑R7)  
  `EXPAND_POLL_MS = 100` ms, `EXPAND_TIMEOUT_MS = 120 000` ms.
- **Interface** (R9‑R15)  
  `EmbedAutoExpandInput` defines navigation level, active layer, layout flag, container IDs, and graph fingerprint.
- **Helper functions**  
  - `containersFullyLaidOut` (R17‑R21) checks `expandedContainers` and `containerLayoutCache`.  
  - `waitForContainerLayouts` (R24‑R35) polls every `EXPAND_POLL_MS` until all target containers are laid out or the timeout expires.
- **Hook logic** (R42‑R129)  
  * Activates only when `embedMode` is true and the navigation level matches (`overview` or `layer-detail`).  
  * Expands missing containers via `expandManyContainers`.  
  * Waits for layout with `waitForContainerLayouts`, then calls `fitView` (duration 550 ms, padding 0.28, maxZoom 1, minZoom 0.2).  
  * Uses `runKeyRef` to avoid duplicate work and `cancelledRef` to abort pending operations.  
  * Returns `isExpanding` to indicate ongoing expansion.

### Impact  
- **Correctness** – ensures containers are expanded before `fitView` is invoked.  
- **Maintainability** – centralizes embed‑specific logic; helper functions are pure and testable.  
- **Performance** – polls every 100 ms up to a 120 s timeout; bounded by the defined constants.  
- **Compatibility** – relies on existing `useDashboardStore` and `useReactFlow`; no public API changes.

### Risks & follow‑ups  
- **Race conditions** – `waitForContainerLayouts` may not handle rapid layout changes; test with concurrent expansions.  
- **Timeout edge cases** – 120 s may be excessive for very large graphs; consider exposing the timeout.  
- **Embed mode detection** – depends on `useNovaDiffEmbed`; verify it reports `embedMode` correctly.  
- **Viewport fitting** – validate that the `fitView` parameters produce the intended zoom/center across screen sizes; adjust padding if needed.
