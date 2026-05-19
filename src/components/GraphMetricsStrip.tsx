import { useState } from "react";
import type { DocWorkspaceMetrics } from "../app/docWorkspaceMetrics";
import { DocMermaidMount } from "./DocMermaidMount";

export interface GraphMetricsStripProps {
  metrics: DocWorkspaceMetrics;
  pieDef: string;
  depthDef: string;
  importDef: string;
  callDef: string;
  metricsChartsLoading: boolean;
  outlineLoading: boolean;
  topExtensions: { ext: string; count: number }[];
  topRoots: { name: string; count: number }[];
}

export function GraphMetricsStrip({
  metrics,
  pieDef,
  depthDef,
  importDef,
  callDef,
  metricsChartsLoading,
  outlineLoading,
  topExtensions,
  topRoots,
}: GraphMetricsStripProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`kg-metrics-strip${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="kg-metrics-strip-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Hide compare metrics" : "Compare metrics — change mix, depth, imports, roots"}
      </button>
      {open ? (
        <div className="kg-metrics-strip-body doc-state-enter">
          <div className="doc-workspace-grid doc-workspace-charts kg-metrics-charts">
            <div
              className={`doc-workspace-chart${metricsChartsLoading ? " is-loading" : ""}`}
            >
              <h3 className="doc-workspace-h3">Change mix</h3>
              <DocMermaidMount
                definition={pieDef}
                loading={metricsChartsLoading}
                loadingLabel="Computing change mix…"
              />
            </div>
            <div
              className={`doc-workspace-chart${metricsChartsLoading ? " is-loading" : ""}`}
            >
              <h3 className="doc-workspace-h3">Depth distribution</h3>
              <DocMermaidMount
                definition={depthDef}
                loading={metricsChartsLoading}
                loadingLabel="Computing depth distribution…"
              />
            </div>
          </div>
          <div className="doc-workspace-grid doc-workspace-charts kg-metrics-charts">
            <div className={`doc-workspace-chart${outlineLoading ? " is-loading" : ""}`}>
              <h3 className="doc-workspace-h3">Module imports (JS/TS)</h3>
              <DocMermaidMount
                definition={importDef}
                loading={outlineLoading}
                loadingLabel="Scanning target imports…"
              />
            </div>
            <div className={`doc-workspace-chart${outlineLoading ? " is-loading" : ""}`}>
              <h3 className="doc-workspace-h3">Cross-file calls (heuristic)</h3>
              <DocMermaidMount
                definition={callDef}
                loading={outlineLoading}
                loadingLabel="Building call graph…"
              />
            </div>
          </div>
          <div className="doc-workspace-tables kg-metrics-tables">
            <div>
              <h3 className="doc-workspace-h3">Top extensions</h3>
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Extension</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topExtensions.slice(0, 10).map((r) => (
                    <tr key={r.ext}>
                      <td>
                        <code>{r.ext}</code>
                      </td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="doc-workspace-h3">Top path roots</h3>
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Segment</th>
                    <th>Files</th>
                  </tr>
                </thead>
                <tbody>
                  {topRoots.slice(0, 10).map((r) => (
                    <tr key={r.name}>
                      <td>
                        <code>{r.name}</code>
                      </td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="doc-workspace-muted kg-metrics-foot">
            {Object.values(metrics.byKind).reduce((a, b) => a + b, 0)} paths in compare scope · extensions and roots from filtered
            diff paths
          </p>
        </div>
      ) : null}
    </div>
  );
}
