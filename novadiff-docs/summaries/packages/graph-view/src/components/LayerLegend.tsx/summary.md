### Overview  
A new component `LayerLegend` was added to `packages/graph-view/src/components/LayerLegend.tsx`. It introduces a shared color palette, a helper `getLayerColor`, and renders a legend of graph layers.

### Key changes  
- **Imports** (lines 1‑2): `useDashboardStore` from `../store` and `useI18n` from `../contexts/I18nContext`.  
- **Palette** (lines 5‑13): exported `LAYER_PALETTE` – an array of 7 objects, each with `bg`, `border`, and `label` colors. Used by `LayerLegend`, `LayerClusterNode`, `PortalNode`, and `GraphView`.  
- **Helper** (lines 15‑17): `getLayerColor(index)` returns `LAYER_PALETTE[index % LAYER_PALETTE.length]`.  
- **Component** (lines 19‑72): pulls `graph`, `navigationLevel`, `activeLayerId` from the store and `t` from i18n. Renders a flex container with layer names, counts, and color indicators. Opacity and text styles change based on `navigationLevel`. Early exit (line 28) returns `null` when `graph?.layers` is empty.

### Impact  
- Provides a visual summary of layers; no existing UI is altered.  
- Requires the i18n context to be mounted; otherwise `useI18n()` will throw.  
- Centralizes the palette, reducing duplication; consuming components can import `LAYER_PALETTE` and `getLayerColor`.  
- Rendering complexity is O(n) over the number of layers, negligible for typical counts.

### Risks & follow‑ups  
- **i18n availability**: Ensure `LayerLegend` is rendered within an `I18nContext` provider.  
- **Store shape**: `graph`, `navigationLevel`, and `activeLayerId` must exist in the store; missing keys yield `undefined`.  
- **Palette length**: `getLayerColor` uses modulo; consuming components should handle the 7‑entry palette.  
- **Styling classes**: CSS classes such as `text-text-secondary`, `text-text-primary`, and `text-text-muted` must be defined; missing classes could affect appearance.
