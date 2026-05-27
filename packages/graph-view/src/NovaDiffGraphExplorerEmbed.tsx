import { useEffect, useMemo, useRef } from "react";
import { validateGraph } from "@novadiff/graph-core/schema";
import type { KnowledgeGraph } from "@novadiff/graph-core/types";
import { useDashboardStore } from "./store";
import {
  NovaDiffEmbedContext,
  type ExplainCodeRequest,
  type NovaDiffSourceFile,
} from "./contexts/NovaDiffEmbedContext";
import { I18nProvider } from "./contexts/I18nContext";
import { EmbedDashboardPanel } from "./EmbedDashboardPanel";
import { GraphEmbedSyncBridge } from "./GraphEmbedSyncBridge";
import type { DetailLevel } from "./store";

export interface NovaDiffGraphExplorerEmbedProps {
  graph: KnowledgeGraph;
  readFile?: (relativePath: string) => Promise<NovaDiffSourceFile>;
  explainCode?: (
    request: ExplainCodeRequest,
    onChunk: (text: string) => void,
  ) => Promise<string>;
  outputLanguage?: string;
  controlledNodeId?: string | null;
  enteredFilePath?: string | null;
  focusMode?: boolean;
  detailLevel?: DetailLevel;
  showFunctionsInClassView?: boolean;
  cityFilterNodeIds?: string[] | null;
  onSelectionChange?: (nodeId: string | null) => void;
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

/** Embed-only explorer — loads graph into store for drill-in, without dashboard chrome. */
export function NovaDiffGraphExplorerEmbed({
  graph,
  readFile,
  explainCode,
  outputLanguage = "en",
  controlledNodeId,
  enteredFilePath,
  focusMode,
  detailLevel,
  showFunctionsInClassView,
  cityFilterNodeIds,
  onSelectionChange,
}: NovaDiffGraphExplorerEmbedProps) {
  const validation = useMemo(() => validateGraph(graph), [graph]);
  const storeGraph = useDashboardStore((s) => s.graph);
  const loadedFingerprintRef = useRef<string | null>(null);

  useEffect(() => {
    if (!validation.success || !validation.data) {
      return;
    }
    const fingerprint = graphFingerprint(graph);
    if (loadedFingerprintRef.current === fingerprint) {
      return;
    }
    loadedFingerprintRef.current = fingerprint;

    const store = useDashboardStore.getState();
    store.stopTour();
    store.resetEmbedOverlays();
    store.clearLayoutIssues();
    store.setGraph(validation.data);
    const kind = (graph as KnowledgeGraph & { kind?: string }).kind;
    if (kind === "knowledge") {
      store.setViewMode("knowledge");
      store.setIsKnowledgeGraph(true);
    } else {
      store.setViewMode("structural");
      store.setIsKnowledgeGraph(false);
      store.enterNovaDiffEmbedDepth();
    }
  }, [graph, validation]);

  useEffect(() => {
    return () => {
      loadedFingerprintRef.current = null;
      const store = useDashboardStore.getState();
      store.stopTour();
      store.resetEmbedOverlays();
      store.clearLayoutIssues();
      store.enterNovaDiffEmbedDepth();
    };
  }, []);

  const embedValue = useMemo(
    () => ({ readFile, explainCode, embedMode: true as const }),
    [readFile, explainCode],
  );

  if (!validation.success || !validation.data) {
    const fatal = validation.fatal;
    return (
      <p className="novadiff-graph-load-error">
        {fatal ? `Invalid knowledge graph: ${fatal}` : "Invalid knowledge graph"}
      </p>
    );
  }

  if (!storeGraph) {
    return (
      <div className="knowledge-graph-skeleton novadiff-graph-explorer-root">
        <div className="knowledge-graph-skeleton-bar" />
        <p>Preparing graph…</p>
      </div>
    );
  }

  return (
    <NovaDiffEmbedContext.Provider value={embedValue}>
      <I18nProvider language={outputLanguage}>
        <GraphEmbedSyncBridge
          controlledNodeId={controlledNodeId}
          enteredFilePath={enteredFilePath}
          focusMode={focusMode}
          detailLevel={detailLevel}
          showFunctionsInClassView={showFunctionsInClassView}
          cityFilterNodeIds={cityFilterNodeIds}
          onSelectionChange={onSelectionChange}
        />
        <EmbedDashboardPanel graphIssues={validation.issues} />
      </I18nProvider>
    </NovaDiffEmbedContext.Provider>
  );
}
