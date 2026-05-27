### Overview  
The `index.css` for the graph‑view package has been extended to support a *liquid‑glass* UI mode and to tighten the styling of the embedded NovaDiff graph. New rules remove background paints from React‑Flow elements, adjust edge and node layering, and refine the minimap and control panel layout.

### Key changes  
- **Liquid‑glass mode** (`html.app-liquid-glass` selectors) now clears background, color, image, and shadow on all major graph containers (`.novadiff-graph-explorer-root`, `.novadiff-graph-theme-host`, `.embed-graph-flow-host`, etc.) and on React‑Flow canvas elements (`.react-flow__background`, `.react-flow__pane`, `.react-flow__viewport`, `.react-flow__minimap`).  
- **Edge visibility**: `.novadiff-graph-embed .react-flow__edges` gets `z-index: 10` to stay above container panels; edge paths are styled with a subtle blue stroke (`rgba(56,217,255,0.42)`).  
- **Node
