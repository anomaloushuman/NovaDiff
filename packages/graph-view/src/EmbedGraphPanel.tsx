/**
 * NovaDiff documentation embed — full interactive graph (overview + layer drill-in).
 * Uses the shared GraphViewInner inside a sized host so React Flow gets pixel dimensions.
 */

import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GraphViewInner } from "./components/GraphView";
import { useDashboardStore } from "./store";
import { ThemeProvider } from "./themes/index";
import { resolveNovaDiffEmbedTheme } from "./themes/novadiffEmbed";

type FlowDimensions = { width: number; height: number };

function EmbedEscapeToOverview() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      const state = useDashboardStore.getState();
      if (state.navigationLevel === "layer-detail") {
        state.navigateToOverview();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

function EmbedSizedInteractiveGraph() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<FlowDimensions | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) {
      return;
    }
    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width < 1 || height < 1) {
        setDimensions((prev) => (prev == null ? prev : null));
        return;
      }
      setDimensions((prev) =>
        prev?.width === width && prev?.height === height ? prev : { width, height },
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="embed-graph-flow-host">
      {dimensions ? (
        <ReactFlowProvider>
          <div
            className="embed-graph-flow-pane"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              minWidth: dimensions.width,
              minHeight: dimensions.height,
            }}
          >
            <EmbedEscapeToOverview />
            <GraphViewInner />
          </div>
        </ReactFlowProvider>
      ) : null}
    </div>
  );
}

export function EmbedGraphPanel() {
  const graph = useDashboardStore((s) => s.graph);
  const [embedTheme, setEmbedTheme] = useState(resolveNovaDiffEmbedTheme);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const updateTheme = () => setEmbedTheme(resolveNovaDiffEmbedTheme());
    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, []);

  return (
    <ThemeProvider metaTheme={embedTheme} scopeToHost>
      <div className="novadiff-graph-explorer-root novadiff-graph-embed">
        {graph ? (
          <EmbedSizedInteractiveGraph />
        ) : (
          <div className="embed-graph-layout-overlay">
            <span>Preparing graph…</span>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
