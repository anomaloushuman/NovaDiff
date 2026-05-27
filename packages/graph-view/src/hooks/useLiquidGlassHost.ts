import { useEffect, useState } from "react";
import { isLiquidGlassHost } from "../themes/theme-engine.ts";

/** Re-render when NovaDiff macOS liquid-glass mode toggles on documentElement. */
export function useLiquidGlassHost(): boolean {
  const [active, setActive] = useState(isLiquidGlassHost);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setActive(isLiquidGlassHost());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return active;
}
