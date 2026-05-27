### Overview  
A new hook `useLiquidGlassHost` is added to `packages/graph-view/src/hooks/useLiquidGlassHost.ts` (lines 1‑16). It tracks whether the document is in macOS liquid‑glass mode and triggers a re‑render when the mode toggles.

### Key changes  
- **Imports**  
  ```ts
  import { useEffect, useState } from "react";
  import { isLiquidGlassHost } from "../themes/theme-engine.ts";
  ```
- **Hook export**  
  ```ts
  export function useLiquidGlassHost(): boolean
  ```
- **State initialization** – the initial value reflects the current mode:  
  ```ts
  const [active, setActive] = useState(isLiquidGlassHost);
  ```
- **Effect** – a `MutationObserver` watches `document.documentElement` for changes to the `class` attribute and updates `active`:  
  ```ts
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setActive(isLiquidGlassHost());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  ```
- **Return value** – the hook returns the current `active` boolean.

### Impact  
- **Re‑rendering** – components using the hook re‑render only when liquid‑glass mode changes.  
- **Centralization** – mode detection logic is encapsulated in one place; changes to `isLiquidGlassHost` automatically propagate.  
- **Efficiency** – the observer monitors only the `class` attribute, limiting DOM traversal.

### Risks & follow‑ups  
- **Dependency array** – the `useEffect` has an empty array; if `isLiquidGlassHost` changes implementation, the hook may not react.  
- **Observer overhead** – observing `document.documentElement` could be costly on very large DOM trees; benchmark on target devices.  
- **Cleanup** – ensure `observer.disconnect()` runs on component unmount; test unmount scenarios.  
- **Cross‑browser support** – verify `MutationObserver` behaves consistently in all target browsers, especially Safari on macOS.
