### Overview  
`NovaDiffGraphExplorerEmbed` now accepts three optional props—`detailLevel`, `showFunctionsInClassView`, and `cityFilterNodeIds`. The change is confined to **packages/graph-view/src/NovaDiffGraphExplorerEmbed.tsx** (lines 13, 26‑28, 53‑55, 129‑131). A type‑only import for `DetailLevel` is added, keeping the runtime bundle unchanged.

### Key changes  
- **Import**: `import type { DetailLevel } from "./store";` (R13).  
- **Props**:  
  - `detailLevel?: DetailLevel;` (R26)  
  - `showFunctionsInClassView?: boolean;` (R27)  
  - `cityFilterNodeIds?: string[] | null;` (R28).  
- **Component signature** updated to include the new props (R53‑55).  
- **Prop forwarding**: the three props are passed to `GraphEmbedSyncBridge` (R129‑131).  
- No other logic or rendering changes were made.

### Impact  
- **Non‑breaking**: all new props are optional; existing consumers compile and run unchanged.  
- **Type safety**: the `DetailLevel` import is type‑only, so there is no runtime cost.  
- **Behavior**: the effect of `showFunctionsInClassView` and `cityFilterNodeIds` on node visibility is unknown from the available diff/scan evidence; they are simply forwarded to `GraphEmbedSyncBridge`.  
- **Documentation**: API surface expands; docs and examples should list the new options.  
- **Testing**: existing unit tests remain valid; new tests should verify the optional props’ effects.

### Risks & follow‑ups  
- **Prop handling**: confirm that `GraphEmbedSyncBridge` accepts and applies the new props; otherwise the UI may not reflect the intended settings.  
- **Backward compatibility**: ensure legacy code importing `NovaDiffGraphExplorerEmbedProps` does not rely on the absence of these fields; TypeScript will treat them as optional.  
- **Performance**: filtering by `cityFilterNodeIds` could introduce lag on large graphs; benchmark if necessary.  
- **Documentation**: update README/API docs to describe the new props and their default behaviors.
