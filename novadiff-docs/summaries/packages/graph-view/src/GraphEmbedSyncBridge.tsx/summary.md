### Overview  
A new React component `GraphEmbedSyncBridge` is added to `packages/graph-view/src/GraphEmbedSyncBridge.tsx` (lines 1‑71). It synchronizes embed‑graph selection and navigation state with the NovaDiff documentation workspace.

### Key changes  
- **Imports** (R1‑R8):  
  ```ts
  import { useEffect, useRef } from "react";
  import { useDashboardStore } from "./store";
  import {
    applyGraphCityRoot,
    applyGraphEnterFile,
    applyGraphFocusSelection,
    type GraphCityNavStore,
  } from "./utils/graphCityNavigation";
  ```
- **Exported API** (R11‑R20):  
  ```ts
  export function GraphEmbedSyncBridge({
    controlledNodeId,
    enteredFilePath,
    focusMode,
    onSelectionChange,
  }: {
    controlledNodeId?: string | null;
    enteredFilePath?: string | null;
    focusMode?: boolean;
    onSelectionChange?: (nodeId: string | null) => void;
  }) { … }
  ```
- **State access** (R22‑R24): reads `selectedNodeId` and `graph` from `useDashboardStore`.
- **Store API helper** (R27‑R36): `storeApi()` returns navigation functions from the global store state.
- **Navigation effect** (R39‑R57): watches `enteredFilePath`, `controlledNodeId`, `focusMode`, and `graph`. Builds a `navKey` and calls the appropriate helper (`applyGraphEnterFile`, `applyGraphFocusSelection`, or `applyGraphCityRoot`).
- **Selection emission** (R59‑R67): emits `selectedNodeId` changes via `onSelectionChange`, guarded by a `lastEmitted` ref.
- **Return value** (R70‑R71): renders `null`.

### Impact  
- The component introduces a side‑effect path that depends on the presence of `useDashboardStore` in the component’s context.  
- Navigation helpers are invoked with `controlledNodeId ?? null`; callers must ensure these helpers handle `null` values.  
- The `navKey` logic prevents redundant navigation when props remain unchanged.

### Risks & follow‑ups  
- Verify that `useDashboardStore` is available; otherwise the hook will throw.  
- Confirm that `applyGraphEnterFile`, `applyGraphFocusSelection`, and `applyGraphCityRoot` correctly handle `null`/`undefined` arguments.  
- Test the `navKey` logic with rapid prop changes to ensure no unnecessary navigation occurs.  
- Add unit tests for the two `useEffect` branches to guard against regressions in dependency arrays or ref updates.
