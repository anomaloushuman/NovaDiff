import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { FileChange } from "../app/types";
import type { LlmSettings } from "../app/llmStorage";
import type { DocWorkspaceMetrics } from "../app/docWorkspaceMetrics";
import { isNovadiffDocsReservedPath } from "../app/novadiffPaths";
import { useBackgroundActivityActionsOptional } from "../app/BackgroundActivityContext";
import { GraphMetricsStrip } from "./GraphMetricsStrip";
import "../../packages/graph-view/src/index.css";

const NovaDiffGraphExplorer = lazy(() =>
  import("@novadiff/graph-view").then((m) => ({ default: m.NovaDiffGraphExplorer })),
);

export interface KnowledgeGraphPanelProps {
  compared: boolean;
  leftRoot: string;
  rightRoot: string;
  leftTitle: string;
  rightTitle: string;
  docRows: FileChange[];
  llmSettings: LlmSettings;
  metrics: DocWorkspaceMetrics;
  pieDef: string;
  depthDef: string;
  importDef: string;
  callDef: string;
  metricsChartsLoading: boolean;
  outlineLoading: boolean;
}

type BuildSide = "target" | "baseline";

type KnowledgeGraph = import("@novadiff/graph-core/types").KnowledgeGraph;

type GraphPayload = {
  graph: KnowledgeGraph;
  diffOverlay: {
    changedNodeIds: string[];
    affectedNodeIds: string[];
  } | null;
};

type GraphProgress = {
  message: string;
  current?: number;
  total?: number;
  phase?: string;
};

function parseProgressMessage(msg: string): Pick<GraphProgress, "current" | "total"> {
  const match = msg.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) {
    return {};
  }
  return { current: Number(match[1]), total: Number(match[2]) };
}

function buildAutoKey(
  activeRoot: string,
  buildSide: BuildSide,
  compared: boolean,
  changeCount: number,
) {
  return `${activeRoot}::${buildSide}::${compared ? changeCount : 0}`;
}

class GraphExplorerErrorBoundary extends Component<
  { children: ReactNode; onReset?: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[KnowledgeGraphPanel] explorer render failed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="knowledge-graph-skeleton knowledge-graph-explorer-error">
          <p className="doc-workspace-alert">
            Knowledge graph explorer failed to render: {this.state.error.message}
          </p>
          <button
            type="button"
            className="doc-workspace-copy-btn"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          >
            Retry explorer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function KnowledgeGraphPanel({
  compared,
  leftRoot,
  rightRoot,
  leftTitle,
  rightTitle,
  docRows,
  llmSettings,
  metrics,
  pieDef,
  depthDef,
  importDef,
  callDef,
  metricsChartsLoading,
  outlineLoading,
}: KnowledgeGraphPanelProps) {
  const [buildSide, setBuildSide] = useState<BuildSide>("target");
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState<GraphProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    nodeCount: number;
    edgeCount: number;
    fileCount: number;
    hasDiffOverlay: boolean;
  } | null>(null);
  const [graphPayload, setGraphPayload] = useState<GraphPayload | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [explorerMounted, setExplorerMounted] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const buildGenerationRef = useRef(0);
  const lastAutoKeyRef = useRef<string | null>(null);
  const { upsertActivity, removeActivity } = useBackgroundActivityActionsOptional() ?? {};

  const activeRoot = buildSide === "baseline" ? leftRoot.trim() : rightRoot.trim();
  const autoKey = useMemo(
    () => buildAutoKey(activeRoot, buildSide, compared, docRows.length),
    [activeRoot, buildSide, compared, docRows.length],
  );

  const progressPercent = useMemo(() => {
    if (progress?.phase === "assemble" || progress?.phase === "done") {
      return progress.phase === "done" ? 100 : 92;
    }
    if (progress?.phase === "scan") {
      return 5;
    }
    if (progress?.current != null && progress.total != null && progress.total > 0) {
      // Reserve headroom for assembly; extract is ~10–85%.
      const extractPct = (progress.current / progress.total) * 75 + 10;
      return Math.min(88, Math.round(extractPct));
    }
    if (building) {
      return undefined;
    }
    return null;
  }, [building, progress]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onKnowledgeGraphProgress) {
      return;
    }
    return api.onKnowledgeGraphProgress((msg) => {
      const message = String(msg?.message ?? "");
      const parsed =
        msg?.current != null && msg?.total != null
          ? { current: msg.current, total: msg.total }
          : parseProgressMessage(message);
      setProgress({
        message,
        phase: msg?.phase,
        ...parsed,
      });
      const pct =
        parsed.current != null && parsed.total != null && parsed.total > 0
          ? Math.min(92, Math.round((parsed.current / parsed.total) * 88 + 8))
          : msg?.phase === "done"
            ? 100
            : null;
      upsertActivity?.({
        id: "knowledge-graph",
        kind: "graph",
        label: "Knowledge graph",
        detail: message,
        progress: pct,
      });
    });
  }, [upsertActivity]);

  const loadGraphFromDisk = useCallback(async (projectRoot: string) => {
    const api = window.electronAPI;
    if (!api?.readKnowledgeGraph) {
      return null;
    }
    try {
      const data = await api.readKnowledgeGraph({ projectRoot });
      if (!data.ok || !data.graph) {
        return null;
      }
      return {
        graph: data.graph as unknown as KnowledgeGraph,
        diffOverlay: data.diffOverlay ?? null,
      };
    } catch {
      return null;
    }
  }, []);

  const runBuild = useCallback(
    async (opts?: { force?: boolean }) => {
      const api = window.electronAPI;
      if (!api?.buildKnowledgeGraph || !activeRoot) {
        return;
      }
      const generation = ++buildGenerationRef.current;
      setBuilding(true);
      setError(null);
      setProgress({ message: "Starting knowledge graph build…", phase: "start" });
      upsertActivity?.({
        id: "knowledge-graph",
        kind: "graph",
        label: "Knowledge graph",
        detail: "Starting build…",
        progress: 4,
      });
      if (opts?.force) {
        setStats(null);
        setGraphPayload(null);
      }

      try {
        if (!opts?.force) {
          const cached = await loadGraphFromDisk(activeRoot);
          if (generation !== buildGenerationRef.current) {
            return;
          }
          if (cached) {
            setGraphPayload(cached);
            setStatusLine("Saved graph available — open explorer when ready");
            setProgress(null);
            return;
          }
        }

        const result = await api.buildKnowledgeGraph({
          projectRoot: activeRoot,
          side: buildSide,
          leftTitle,
          rightTitle,
          changes: buildSide === "target" ? docRows : [],
        });
        if (generation !== buildGenerationRef.current) {
          return;
        }
        setStats({
          nodeCount: result.nodeCount,
          edgeCount: result.edgeCount,
          fileCount: result.fileCount,
          hasDiffOverlay: result.hasDiffOverlay,
        });
        const loaded = await loadGraphFromDisk(activeRoot);
        if (generation !== buildGenerationRef.current) {
          return;
        }
        if (loaded) {
          setGraphPayload(loaded);
          setStatusLine("Knowledge graph ready — open explorer to view");
          setProgress({ message: "Complete", current: 1, total: 1, phase: "done" });
        }
      } catch (e) {
        if (generation !== buildGenerationRef.current) {
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
        setProgress(null);
        setStatusLine(null);
      } finally {
        if (generation === buildGenerationRef.current) {
          setBuilding(false);
          removeActivity?.("knowledge-graph");
        }
      }
    },
    [activeRoot, buildSide, docRows, leftTitle, loadGraphFromDisk, removeActivity, rightTitle, upsertActivity],
  );

  useEffect(() => {
    if (!activeRoot) {
      return;
    }
    if (lastAutoKeyRef.current === autoKey) {
      return;
    }
    lastAutoKeyRef.current = autoKey;
    setViewerOpen(false);

    const start = () => {
      void (async () => {
        const cached = await loadGraphFromDisk(activeRoot);
        if (cached) {
          setGraphPayload(cached);
          setStatusLine("Saved graph on disk — use Rebuild to refresh");
          return;
        }
        void runBuild({ force: true });
      })();
    };

    // Defer graph scan/build so Documentation can paint first.
    const idle = window.requestIdleCallback?.(start, { timeout: 2500 });
    if (idle == null) {
      const timer = window.setTimeout(start, 400);
      return () => window.clearTimeout(timer);
    }
    return () => window.cancelIdleCallback(idle);
  }, [activeRoot, autoKey, loadGraphFromDisk, runBuild]);

  useEffect(() => {
    if (!activeRoot) {
      lastAutoKeyRef.current = null;
    }
  }, [activeRoot]);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!viewerOpen) {
      setIsFullscreen(false);
    }
  }, [viewerOpen]);

  const readFile = useCallback(
    async (relativePath: string) => {
      const api = window.electronAPI;
      if (!api?.readKnowledgeGraphFile || !activeRoot) {
        throw new Error("File preview unavailable");
      }
      return api.readKnowledgeGraphFile({
        projectRoot: activeRoot,
        relativePath,
      });
    },
    [activeRoot],
  );

  useEffect(() => {
    if (graphPayload) {
      setViewerOpen(true);
    }
  }, [graphPayload]);

  useEffect(() => {
    if (!graphPayload || !viewerOpen) {
      setExplorerMounted(false);
      return;
    }
    const frame = requestAnimationFrame(() => setExplorerMounted(true));
    return () => cancelAnimationFrame(frame);
  }, [graphPayload, viewerOpen]);

  const explainCode = useCallback(
    async (
      request: {
        filePath: string;
        startLine: number;
        endLine: number;
        snippet: string;
        symbolName?: string;
      },
      onChunk: (text: string) => void,
    ) => {
      const api = window.electronAPI;
      if (!api?.llmSummarizeStream && !api?.llmSummarize) {
        throw new Error("LLM is not available in this build.");
      }
      if (!activeRoot) {
        throw new Error("Missing project root.");
      }
      if (isNovadiffDocsReservedPath(request.filePath)) {
        throw new Error("Cannot document reserved novadiff-docs paths.");
      }
      const payload = {
        ...llmSettings,
        explainCode: true,
        relPath: request.filePath,
        kind: "modified",
        leftLabel: leftTitle,
        rightLabel: rightTitle,
        codeExcerpt: request.snippet,
        lineStart: request.startLine,
        lineEnd: request.endLine,
        symbolName: request.symbolName,
      };
      let streamed = "";
      if (api.llmSummarizeStream) {
        await api.llmSummarizeStream(payload, (text) => {
          streamed = text;
          onChunk(text);
        });
      } else if (api.llmSummarize) {
        streamed = await api.llmSummarize(payload);
        onChunk(streamed);
      }
      const selectionKey = `lines-${request.startLine}-${request.endLine}`;
      if (streamed.trim() && api.saveSelectionSummaryArtifacts) {
        await api.saveSelectionSummaryArtifacts({
          targetRoot: activeRoot,
          relPath: request.filePath,
          kind: "modified",
          selectionKey,
          markdown: streamed,
          label: `Code explanation (L${request.startLine}-${request.endLine})`,
          requestedMode: "exact",
          effectiveMode: "exact",
          lineRanges: [
            {
              startRow: 0,
              endRow: 0,
              leftStart: null,
              leftEnd: null,
              rightStart: request.startLine,
              rightEnd: request.endLine,
            },
          ],
          symbol: null,
          leftTitle,
          rightTitle,
        });
      }
      return streamed;
    },
    [activeRoot, leftTitle, llmSettings, rightTitle],
  );

  const viewerShell =
    graphPayload && viewerOpen ? (
      <div
        className={`novadiff-graph-shell knowledge-graph-viewer${isFullscreen ? " is-fullscreen" : ""}`}
        role="region"
        aria-label="Knowledge graph explorer"
      >
        {isFullscreen ? (
          <div className="knowledge-graph-fullscreen-bar">
            <span className="knowledge-graph-fullscreen-title">Knowledge graph</span>
            <button
              type="button"
              className="doc-workspace-copy-btn"
              onClick={() => setIsFullscreen(false)}
            >
              Exit fullscreen
            </button>
          </div>
        ) : null}
        <GraphMetricsStrip
          metrics={metrics}
          pieDef={pieDef}
          depthDef={depthDef}
          importDef={importDef}
          callDef={callDef}
          metricsChartsLoading={metricsChartsLoading}
          outlineLoading={outlineLoading}
          topExtensions={metrics.extensionCounts}
          topRoots={metrics.topRoots}
        />
        {explorerMounted ? (
          <div className="novadiff-graph-explorer-slot">
          <GraphExplorerErrorBoundary
            onReset={() => {
              setExplorerMounted(false);
              requestAnimationFrame(() => setExplorerMounted(true));
            }}
          >
            <Suspense
              fallback={
                <div className="knowledge-graph-skeleton">
                  <div className="knowledge-graph-skeleton-bar" />
                  <p>Loading interactive explorer…</p>
                </div>
              }
            >
              <NovaDiffGraphExplorer
                key={`${graphPayload.graph.project?.name ?? "graph"}-${graphPayload.graph.nodes.length}`}
                graph={graphPayload.graph}
                diffOverlay={graphPayload.diffOverlay}
                readFile={readFile}
                explainCode={explainCode}
                embedMode
              />
            </Suspense>
          </GraphExplorerErrorBoundary>
          </div>
        ) : (
          <div className="knowledge-graph-skeleton">
            <div className="knowledge-graph-skeleton-bar" />
            <p>Opening explorer…</p>
          </div>
        )}
      </div>
    ) : null;

  return (
    <section
      className={`doc-workspace-panel knowledge-graph-panel${building ? " is-building" : ""}${viewerOpen ? " has-viewer" : ""}`}
    >
      <div className="knowledge-graph-head">
        <div>
          <h2 className="doc-workspace-h2">Code knowledge graph</h2>
          <p className="doc-workspace-prose">
            Primary documentation view: structure map, compare metrics, imports, and cross-file
            calls. Select line numbers in Open code, then Explain code to stream AI notes into{" "}
            <code>novadiff-docs/selections/</code>.
          </p>
        </div>
        {statusLine ? (
          <span className={`knowledge-graph-status${building ? " is-live" : ""}`}>
            {building ? <span className="knowledge-graph-pulse" aria-hidden /> : null}
            {statusLine}
          </span>
        ) : null}
      </div>

      {!compared ? (
        <p className="doc-workspace-muted">
          Run a folder comparison to enable diff highlighting on the target graph.
        </p>
      ) : null}

      <div className="doc-workspace-commit-actions knowledge-graph-toolbar">
        <div className="code-city-segmented">
          <button
            type="button"
            className={
              buildSide === "target" ? "code-city-control-btn active" : "code-city-control-btn"
            }
            disabled={building}
            onClick={() => setBuildSide("target")}
          >
            Target tree
          </button>
          <button
            type="button"
            className={
              buildSide === "baseline"
                ? "code-city-control-btn active"
                : "code-city-control-btn"
            }
            disabled={building}
            onClick={() => setBuildSide("baseline")}
          >
            Baseline tree
          </button>
        </div>
        <button
          type="button"
          className="doc-workspace-copy-btn"
          disabled={building || !activeRoot}
          onClick={() => void runBuild({ force: true })}
        >
          {building ? "Rebuilding…" : "Rebuild graph"}
        </button>
        {graphPayload && !viewerOpen ? (
          <button
            type="button"
            className="doc-workspace-copy-btn"
            onClick={() => setViewerOpen(true)}
          >
            Show explorer
          </button>
        ) : null}
        {viewerOpen && graphPayload ? (
          <button
            type="button"
            className="doc-workspace-copy-btn"
            onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen explorer"}
          >
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        ) : null}
        {viewerOpen ? (
          <button
            type="button"
            className="doc-workspace-copy-btn"
            onClick={() => {
              setViewerOpen(false);
              setIsFullscreen(false);
            }}
          >
            Hide explorer
          </button>
        ) : null}
      </div>

      {(building || progress) && (
        <div className="knowledge-graph-progress-card doc-state-enter" aria-live="polite">
          <div className="knowledge-graph-progress-top">
            <span className="knowledge-graph-progress-label">
              {progress?.message ?? "Building graph…"}
            </span>
            {progressPercent != null ? (
              <span className="knowledge-graph-progress-pct">{progressPercent}%</span>
            ) : building ? (
              <span className="knowledge-graph-progress-pct knowledge-graph-indeterminate">
                …
              </span>
            ) : null}
          </div>
          <div className="knowledge-graph-progress-track">
            <div
              className={`knowledge-graph-progress-fill${progressPercent == null && building ? " is-indeterminate" : ""}`}
              style={
                progressPercent != null ? { width: `${progressPercent}%` } : undefined
              }
            />
          </div>
        </div>
      )}

      {error ? <p className="doc-workspace-alert">{error}</p> : null}

      {stats ? (
        <div className="code-city-stat-grid knowledge-graph-stats doc-state-enter">
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Nodes</span>
            <strong>{stats.nodeCount.toLocaleString()}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Edges</span>
            <strong>{stats.edgeCount.toLocaleString()}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Files</span>
            <strong>{stats.fileCount.toLocaleString()}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Diff overlay</span>
            <strong>{stats.hasDiffOverlay ? "On" : "Off"}</strong>
          </div>
        </div>
      ) : null}

      {viewerShell &&
        (isFullscreen && typeof document !== "undefined"
          ? createPortal(viewerShell, document.body)
          : viewerShell)}
      {building && !graphPayload && !viewerOpen ? (
        <div className="knowledge-graph-skeleton knowledge-graph-skeleton-large doc-state-enter">
          <div className="knowledge-graph-skeleton-grid" aria-hidden />
          <p>Preparing explorer…</p>
        </div>
      ) : null}

      <p className="doc-workspace-muted knowledge-graph-artifacts">
        <code>{activeRoot || "…"}/.novadiff-graph/</code>
      </p>
    </section>
  );
}
