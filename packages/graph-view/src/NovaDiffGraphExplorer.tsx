import { useEffect, useMemo, useRef, useState } from "react";
import { validateGraph } from "@novadiff/graph-core/schema";
import type { GraphIssue } from "@novadiff/graph-core/schema";
import type { KnowledgeGraph } from "@novadiff/graph-core/types";
import { useDashboardStore } from "./store";
import {
  NovaDiffEmbedContext,
  type ExplainCodeRequest,
  type NovaDiffSourceFile,
} from "./contexts/NovaDiffEmbedContext";
import { I18nProvider } from "./contexts/I18nContext";
import { ThemeProvider } from "./themes/index";
import { DashboardContent } from "./App";
import { NovaDiffGraphExplorerEmbed } from "./NovaDiffGraphExplorerEmbed";

export interface NovaDiffGraphDiffOverlay {
  changedNodeIds: string[];
  affectedNodeIds: string[];
}

export interface NovaDiffGraphExplorerProps {
  graph: KnowledgeGraph;
  diffOverlay?: NovaDiffGraphDiffOverlay | null;
  readFile?: (relativePath: string) => Promise<NovaDiffSourceFile>;
  explainCode?: (
    request: ExplainCodeRequest,
    onChunk: (text: string) => void,
  ) => Promise<string>;
  outputLanguage?: string;
  embedMode?: boolean;
  /** When set, graph selection follows this node id (Documentation ↔ City sync). */
  controlledNodeId?: string | null;
  /** When true with controlledNodeId, enables graph focus neighborhood mode. */
  focusMode?: boolean;
  /** When set, graph drills into this file path (city "enter building"). */
  enteredFilePath?: string | null;
  onSelectionChange?: (nodeId: string | null) => void;
  /** Shared with Code City structure filters (files / classes / functions). */
  detailLevel?: "file" | "class";
  showFunctionsInClassView?: boolean;
  /** Graph node ids matching visible Code City buildings after filters. */
  cityFilterNodeIds?: string[] | null;
}

/** NovaDiff-native graph explorer — no external server or token gate. */
export function NovaDiffGraphExplorer({
  embedMode = false,
  ...props
}: NovaDiffGraphExplorerProps) {
  if (embedMode) {
    return <NovaDiffGraphExplorerEmbed {...props} />;
  }
  return <NovaDiffGraphExplorerFull {...props} />;
}

function graphFingerprint(graph: KnowledgeGraph): string {
  const p = graph.project;
  return [
    graph.version ?? "",
    p?.name ?? "",
    p?.gitCommitHash ?? "",
    graph.nodes.length,
    graph.edges.length,
    graph.layers?.length ?? 0,
  ].join("|");
}

function NovaDiffGraphExplorerFull({
  graph,
  diffOverlay,
  readFile,
  explainCode,
  outputLanguage = "en",
}: Omit<NovaDiffGraphExplorerProps, "embedMode">) {
  const setGraph = useDashboardStore((s) => s.setGraph);
  const setDiffOverlay = useDashboardStore((s) => s.setDiffOverlay);
  const storeGraph = useDashboardStore((s) => s.graph);
  const [graphIssues, setGraphIssues] = useState<GraphIssue[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const loadedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    const fingerprint = graphFingerprint(graph);
    if (loadedFingerprintRef.current === fingerprint) {
      return;
    }
    loadedFingerprintRef.current = fingerprint;

    const result = validateGraph(graph);
    if (result.success && result.data) {
      setGraph(result.data);
      setGraphIssues(result.issues);
      setLoadError(null);
      setHydrated(true);
      const kind = (graph as KnowledgeGraph & { kind?: string }).kind;
      const store = useDashboardStore.getState();
      if (kind === "knowledge") {
        store.setViewMode("knowledge");
        store.setIsKnowledgeGraph(true);
      } else {
        store.setViewMode("structural");
        store.setIsKnowledgeGraph(false);
        store.navigateToOverview();
      }
    } else if (result.fatal) {
      loadedFingerprintRef.current = null;
      setHydrated(false);
      setLoadError(`Invalid knowledge graph: ${result.fatal}`);
    } else {
      loadedFingerprintRef.current = null;
      setHydrated(false);
      setLoadError("Invalid knowledge graph");
    }
  }, [graph, setGraph]);

  useEffect(() => {
    if (!diffOverlay || diffOverlay.changedNodeIds.length === 0) {
      return;
    }
    setDiffOverlay(diffOverlay.changedNodeIds, diffOverlay.affectedNodeIds);
  }, [diffOverlay, setDiffOverlay]);

  const embedValue = useMemo(
    () => ({ readFile, explainCode, embedMode: false as const }),
    [readFile, explainCode],
  );

  if (loadError) {
    return <p className="novadiff-graph-load-error">{loadError}</p>;
  }

  if (!hydrated || !storeGraph) {
    return (
      <div className="knowledge-graph-skeleton novadiff-graph-explorer-root">
        <div className="knowledge-graph-skeleton-bar" />
        <p>Preparing graph layout…</p>
      </div>
    );
  }

  return (
    <NovaDiffEmbedContext.Provider value={embedValue}>
      <I18nProvider language={outputLanguage}>
        <ThemeProvider metaTheme={null}>
          <div className="novadiff-graph-explorer-root">
            <DashboardContent
              accessToken="__novadiff__"
              loadError={null}
              graphIssues={graphIssues}
              embedMode={false}
            />
          </div>
        </ThemeProvider>
      </I18nProvider>
    </NovaDiffEmbedContext.Provider>
  );
}
