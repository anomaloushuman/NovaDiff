### Overview  
A new `packages/graph-view/index.html` file has been added (lines R1‑R19). It establishes a minimal HTML5 page that loads Google Fonts, mounts a React app, and links a favicon.

### Key changes  
- **File addition**: `packages/graph-view/index.html` now exists.  
- **Meta tags**: `charset="UTF-8"`, `viewport="width=device-width, initial-scale=1.0"`, and a favicon link to `/favicon.svg`.  
- **Font preconnects**: `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.  
- **Font stylesheet**: loads `DM Serif Display`, `Inter`, and `JetBrains Mono` with `display=swap`.  
- **Root element**: `<div id="root"></div>` for React rendering.  
- **Script entry**: `<script type="module" src="/src/main.tsx"></script>`.

### Impact  
- Provides a clean bootstrap for the graph‑view package.  
- Centralizes meta and script configuration, simplifying future edits.  
- Preconnects to Google Fonts may reduce font‑loading latency (common practice).  

### Risks & follow‑ups  
- **Asset paths**: Verify that `/favicon.svg` and `/src/main.tsx` resolve correctly in the deployed environment.  
- **Font availability**: Ensure the specified families are accessible and that `display=swap` behaves as expected.  
- **Server routing**: Confirm that the server serves this file for the `/graph-view` route and that no other route conflicts occur.  
- **Build pipeline**: Check that the new file is included in the build artifacts and copied to the correct output directory.
