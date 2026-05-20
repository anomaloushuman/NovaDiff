### Overview
A new file `packages/graph-view/index.html` was added (lines 1‑19). It serves as the static entry point for the graph view component.

### Key changes
- Full HTML5 boilerplate: `<!doctype html>`, `<html lang="en">`, `<head>`, `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`.
- Title `<title>NovaDiff Knowledge Graph</title>` and Google Fonts preconnects with a stylesheet link for DM Serif Display, Inter, and JetBrains Mono.
- `<div id="root"></div>` as the mount point for the React app.
- `<script type="module" src="/src/main.tsx"></script>` points to the bundle entry.

### Impact
- Provides a dedicated HTML page that can be loaded directly, independent of client‑side routing.
- The script source `/src/main.tsx` must be resolved by the bundler; misconfiguration will break the page.
- No existing source files were modified; the change is isolated to the new entry point.

### Risks & follow‑ups
- Verify that the new `index.html` is copied to the correct output directory during the build; otherwise the route will return 404.
- Confirm that `main.tsx` mounts to `#root`; a mismatch will prevent rendering.
- Ensure the bundler’s public path aligns with `/src/main.tsx`; otherwise the module may fail to load.
- Run a quick manual test to confirm fonts load, favicon displays, and the graph view renders correctly.
