import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CodeCityMinimapSlot } from "./CodeCityMinimapSlot";

const COVER_ROOT = ".knowledge-graph-cover-stage";
const DOCK_HOST_CLASS = "code-city-graph-dock-host";

/** Controls and panel are the same element in @xyflow/react v12. */
function findControlsHost(): HTMLElement | null {
  return document.querySelector(
    `${COVER_ROOT} .react-flow__controls.react-flow__panel.bottom.left`,
  ) as HTMLElement | null;
}

function hideBuiltInMinimap(): void {
  const minimap = document.querySelector(
    `${COVER_ROOT} .react-flow__minimap`,
  ) as HTMLElement | null;
  if (minimap) {
    minimap.style.setProperty("display", "none", "important");
  }
}

/**
 * Docks code city in the react-flow bottom-left controls host, above a horizontal zoom row.
 */
export function CodeCityMinimapPortal({ children }: { children: ReactNode }) {
  const [controlsHost, setControlsHost] = useState<HTMLElement | null>(null);
  const hiddenMinimapRef = useRef<HTMLElement | null>(null);

  const detachRef = useRef<(() => void) | null>(null);

  const tryAttach = (): boolean => {
    const host = findControlsHost();
    if (!host) {
      return false;
    }
    hideBuiltInMinimap();
    hiddenMinimapRef.current = document.querySelector(
      `${COVER_ROOT} .react-flow__minimap`,
    ) as HTMLElement | null;
    const attached = !host.classList.contains(DOCK_HOST_CLASS);
    host.classList.add(DOCK_HOST_CLASS);
    setControlsHost(host);
    if (attached) {
      window.dispatchEvent(new CustomEvent("code-city-dock-host-ready"));
    }
    return true;
  };

  useLayoutEffect(() => {
    if (tryAttach()) {
      detachRef.current = () => {
        const host = findControlsHost();
        host?.classList.remove(DOCK_HOST_CLASS);
        if (hiddenMinimapRef.current) {
          hiddenMinimapRef.current.style.removeProperty("display");
          hiddenMinimapRef.current = null;
        }
        setControlsHost(null);
      };
      return () => {
        detachRef.current?.();
        detachRef.current = null;
      };
    }

    const root = document.querySelector(COVER_ROOT);
    const intervalId = window.setInterval(() => {
      if (tryAttach()) {
        window.clearInterval(intervalId);
      }
    }, 200);
    const observer =
      root != null
        ? new MutationObserver(() => {
            if (tryAttach()) {
              observer.disconnect();
              window.clearInterval(intervalId);
            }
          })
        : null;
    if (root && observer) {
      observer.observe(root, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      window.clearInterval(intervalId);
      detachRef.current?.();
      detachRef.current = null;
    };
  }, []);

  const slot = <CodeCityMinimapSlot dockedControls>{children}</CodeCityMinimapSlot>;

  if (controlsHost && typeof document !== "undefined") {
    return createPortal(slot, controlsHost);
  }

  return <div className="code-city-minimap-anchor">{slot}</div>;
}
