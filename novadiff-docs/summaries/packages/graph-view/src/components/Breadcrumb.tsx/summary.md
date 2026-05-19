### Overview  
The `Breadcrumb` component in `packages/graph-view/src/components/Breadcrumb.tsx` has been updated to centralize active‑layer resolution and add a navigation path for the NovaDiff embed depth. The inline lookup for the active layer has been replaced with a helper, and the click logic now distinguishes project‑wide layers.

### Key changes  
- **Import added** (`R3`): `import { PROJECT_WIDE_LAYER_ID, resolveActiveLayer } from "../utils/activeLayer";`  
- **New state** (`R10`): `const enterNovaDiffEmbedDepth = useDashboardStore((s) => s.enterNovaDiffEmbedDepth);`  
- **Active layer logic** (`R13‑15`):  
  ```ts
  const activeLayer = graph && activeLayerId ? resolveActiveLayer(graph, activeLayerId) : null;
  const isProjectWide = activeLayerId === PROJECT_WIDE_LAYER_ID;
  ```  
  The previous lookup (`L11`) was removed.  
- **Button click** (`R28`): `onClick={() => (isProjectWide ? navigateToOverview() : enterNovaDiffEmbedDepth())}` – the old `onClick={navigateToOverview}` (`L24`) was removed.  
- **Display text** (`R35`): shows `"All layers · Classes"` when `isProjectWide`, otherwise the layer name (`activeLayer?.name ?? t.layer.defaultName`).  
- **Removed**: the old `activeLayer` lookup and its JSX usage (`L11`, `L31`).

### Impact  
- **Consistency**: Active‑layer resolution is now handled by a single helper, reducing the risk of stale graph lookups.  
- **Maintainability**: Logic is moved out of the component, simplifying future changes.  
- **UI behavior**: The breadcrumb now displays a distinct label for project‑wide layers and routes correctly to the overview or NovaDiff embed depth.

### Risks & follow‑ups  
- Verify that `resolveActiveLayer` correctly handles `undefined` graphs and returns `null` when appropriate.  
- Ensure `PROJECT_WIDE_LAYER_ID` matches the value used elsewhere in the application.  
- Confirm that `enterNovaDiffEmbedDepth` exists in the dashboard store and behaves as expected.  
- Run UI tests to check that the `"All layers · Classes"` label appears only for project‑wide layers.
