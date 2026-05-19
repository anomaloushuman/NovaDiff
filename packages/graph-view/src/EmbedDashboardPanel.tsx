/**
 * NovaDiff documentation embed — full dashboard chrome + project-wide class depth.
 */

import { useEffect, useRef, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { GraphIssue } from "@novadiff/graph-core/schema";
import { DashboardContent } from "./App";
import { useDashboardStore } from "./store";
import { ThemeProvider } from "./themes/index";
import { NOVADIFF_EMBED_THEME } from "./themes/novadiffEmbed";

type FlowDimensions = { width: number; height: number };

function EmbedSizedDashboard({ children }: { children: React.ReactNode }) {
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
            className="embed-graph-flow-pane embed-graph-dashboard-pane flex flex-col min-h-0"
            style={{
              width: dimensions.width,
              height: dimensions.height,
              minWidth: dimensions.width,
              minHeight: dimensions.height,
            }}
          >
            {children}
          </div>
        </ReactFlowProvider>
      ) : null}
    </div>
  );
}

export interface EmbedDashboardPanelProps {
  accessToken?: string;
  graphIssues?: GraphIssue[];
}

export function EmbedDashboardPanel({
  accessToken = "__novadiff__",
  graphIssues = [],
}: EmbedDashboardPanelProps) {
  const graph = useDashboardStore((s) => s.graph);

  return (
    <ThemeProvider metaTheme={NOVADIFF_EMBED_THEME} scopeToHost>
      <div className="novadiff-graph-explorer-root novadiff-graph-embed flex flex-col min-h-0">
        {graph ? (
          <EmbedSizedDashboard>
            <DashboardContent
              accessToken={accessToken}
              loadError={null}
              graphIssues={graphIssues}
              embedMode
            />
          </EmbedSizedDashboard>
        ) : (
          <div className="embed-graph-layout-overlay">
            <span>Preparing graph…</span>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}
