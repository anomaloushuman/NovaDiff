### Overview  
A new entry point `packages/graph-view/src/main.tsx` has been added to bootstrap the Graph View React application.

### Key changes  
- **Imports added** (lines 1‑4):  
  ```ts
  import { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  import "./index.css";
  import App from "./App";
  ```
- **Root rendering** (lines 6‑10):  
  ```ts
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  ```
- The file is brand‑new; no existing sources were modified.

### Impact  
- The app mounts to the DOM element with id `root`. If that element is missing, rendering will fail.  
- Bootstrap logic is centralized, simplifying future updates.  
- Uses React 18’s `createRoot`, enabling concurrent rendering.

### Risks & follow‑ups  
- Verify that the target HTML contains `<div id="root"></div>` before this file runs.  
- Ensure the new `main.tsx` is referenced in the build entry points (e.g., `tsconfig.json`, `vite`/`webpack` config).  
- Confirm that `index.css` exists; missing CSS may affect styling.  
- `createRoot` requires React 18+; check that the project’s dependencies satisfy this requirement.
