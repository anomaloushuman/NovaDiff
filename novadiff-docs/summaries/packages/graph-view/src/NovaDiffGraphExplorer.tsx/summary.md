### Overview  
The `NovaDiffGraphExplorerProps` interface in `packages/graph-view/src/NovaDiffGraphExplorer.tsx` was extended with three optional properties: `detailLevel`, `showFunctionsInClassView`, and `cityFilterNodeIds`. These additions appear in the diff at lines 38‑42 of the interface and are documented with comments that reference Code City structure filters.

### Key changes  
- **New props** added in the interface (lines 38‑42).  
- Each prop is preceded by a comment explaining its intended use.  
- No other parts of the file were modified; the component’s implementation remains unchanged.

### Impact  
- **Type‑level**: Consumers now have additional optional configuration options. Existing code continues to compile because the new fields are optional.  
- **Runtime**: The component does not read these props in the current implementation, so no new runtime behavior or performance impact is introduced.  
- **Compatibility**: The change is non‑breaking; it only expands the public API.  
- **Observability**: No new logs or metrics are emitted; the rendering path is unchanged.

### Risks & follow‑ups  
- **Consumer migration**: Projects importing `NovaDiffGraphExplorerProps` may need to update documentation to reflect the new fields.  
- **Documentation**: Ensure README and prop‑type docs mention the added options.  
- **Unused props**: Verify that downstream code does not assume these props are present; they are currently ignored.  
- **Future usage**: Plan for a future implementation that consumes these props while keeping the interface stable until then.
