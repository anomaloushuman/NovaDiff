import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  measureCodeCityChromeInsets,
  type CodeCityChromeInsets,
} from "../app/codeCityChromeInsets";

const DEFAULT_INSETS: CodeCityChromeInsets = {
  bottom: 0,
  right: 10,
  left: 10,
  hidden: false,
};

export function CodeCityMinimapSlot({
  children,
  dockedControls = false,
}: {
  children: ReactNode;
  dockedControls?: boolean;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [insets, setInsets] = useState<CodeCityChromeInsets>(DEFAULT_INSETS);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) {
      return;
    }

    const host = dockedControls
      ? slot.parentElement
      : slot.closest(".embed-graph-flow-host") ?? slot.parentElement;
    if (!(host instanceof HTMLElement)) {
      return;
    }

    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setInsets(measureCodeCityChromeInsets(host, { dockedControls }));
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(host);
    const layoutRow = host.closest("[data-novadiff-graph-layout-row]");
    if (layoutRow instanceof HTMLElement) {
      ro.observe(layoutRow);
    }

    const cover = host.closest(".knowledge-graph-cover-stage");
    const mo = new MutationObserver(update);
    if (cover instanceof HTMLElement) {
      mo.observe(cover, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden"],
      });
    }
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", update);
    window.addEventListener("novadiff-code-viewer-open-change", update);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("novadiff-code-viewer-open-change", update);
    };
  }, [dockedControls]);

  const style = {
    "--code-city-lift": `${insets.bottom}px`,
  } as CSSProperties;

  return (
    <div
      ref={slotRef}
      className={`code-city-minimap-slot${dockedControls ? " code-city-minimap-slot--dock-controls" : ""}${insets.hidden ? " code-city-minimap-slot--chrome-hidden" : ""}`}
      data-code-city-minimap
      style={style}
    >
      {children}
    </div>
  );
}
