### Overview  
A new `index.html` file was added to the repository (lines 1‑19). It contains the basic HTML skeleton for the NovaDiff web app, including meta tags, font preconnects, and a root element for React.

### Key changes  
- File creation: `index.html` (added lines 1‑19).  
- HTML skeleton: `<!doctype html>` to `</html>`.  
- Meta tags: `<meta charset="UTF-8" />`, `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.  
- Font preconnects: `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.  
- Stylesheet link for Inter and JetBrains Mono.  
- Root element: `<div id="root"></div>`.  
- Script module: `<script type="module" src="/src/main.tsx"></script>`.

### Impact  
- Provides the HTML scaffold required for the app to launch.  
- Centralizes font and meta configuration in one place.  
- Preconnect hints are present, which may improve font load times.  
- Title tag (`NovaDiff`) and viewport meta aid responsive testing.

### Risks & follow‑ups  
- Verify that `/src/main.tsx` resolves correctly in the production build.  
- Ensure no other `index.html` shadows this entry point.  
- Run a smoke test to confirm Google Fonts load without errors.  
- Confirm the new file is included in the final bundle.
