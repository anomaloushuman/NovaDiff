import { useEffect, useRef } from "react";
import { useDashboardStore, type DetailLevel } from "./store";
import {
  applyGraphCityRoot,
  applyGraphEnterFile,
  applyGraphFocusSelection,
  type GraphCityNavStore,
} from "./utils/graphCityNavigation";

/** Syncs embed graph selection and city enter/exit with NovaDiff Documentation workspace. */
export function GraphEmbedSyncBridge({
  controlledNodeId,
  enteredFilePath,
  focusMode,
  detailLevel,
  showFunctionsInClassView,
  cityFilterNodeIds,
  onSelectionChange,
}: {
  controlledNodeId?: string | null;
  enteredFilePath?: string | null;
  focusMode?: boolean;
  detailLevel?: DetailLevel;
  showFunctionsInClassView?: boolean;
  /** Node ids visible in Code City after filters; graph topology mirrors this set. */
  cityFilterNodeIds?: string[] | null;
  onSelectionChange?: (nodeId: string | null) => void;
}) {
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const graph = useDashboardStore((s) => s.graph);
  const lastEmitted = useRef<string | null | undefined>(undefined);
  const lastNavKey = useRef<string>("");

  const storeApi = (): GraphCityNavStore => {
    const s = useDashboardStore.getState();
    return {
      enterNovaDiffEmbedDepth: s.enterNovaDiffEmbedDepth,
      navigateToNodeInLayer: s.navigateToNodeInLayer,
      selectNode: s.selectNode,
      setFocusNode: s.setFocusNode,
      expandContainer: s.expandContainer,
      collapseAllContainers: s.collapseAllContainers,
    };
  };

  useEffect(() => {
    if (enteredFilePath === undefined && controlledNodeId === undefined) {
      return;
    }
    const navKey = `${enteredFilePath ?? ""}|${controlledNodeId ?? ""}|${focusMode ? 1 : 0}`;
    if (lastNavKey.current === navKey) {
      return;
    }
    lastNavKey.current = navKey;

    const store = storeApi();
    if (enteredFilePath) {
      applyGraphEnterFile(store, enteredFilePath, controlledNodeId ?? null);
    } else if (controlledNodeId) {
      applyGraphFocusSelection(store, graph, controlledNodeId);
    } else {
      applyGraphCityRoot(store);
    }
  }, [enteredFilePath, controlledNodeId, focusMode, graph]);

  useEffect(() => {
    if (detailLevel === undefined && showFunctionsInClassView === undefined) {
      return;
    }
    const store = useDashboardStore.getState();
    if (detailLevel !== undefined && store.detailLevel !== detailLevel) {
      store.setDetailLevel(detailLevel);
    }
    if (showFunctionsInClassView !== undefined) {
      const current = useDashboardStore.getState().showFunctionsInClassView;
      if (current !== showFunctionsInClassView) {
        useDashboardStore.setState({
          showFunctionsInClassView,
          containerLayoutCache: new Map(),
          containerSizeMemory: new Map(),
          expandedContainers: new Set(),
          pendingFocusContainer: null,
        });
      }
    }
  }, [detailLevel, showFunctionsInClassView]);

  useEffect(() => {
    if (cityFilterNodeIds === undefined) {
      return;
    }
    const next =
      cityFilterNodeIds === null ? null : new Set(cityFilterNodeIds);
    useDashboardStore.getState().setEmbedCityFilterNodeIds(next);

    if (!next) {
      return;
    }
    const store = useDashboardStore.getState();
    const { selectedNodeId, focusNodeId } = store;
    const activeId = focusNodeId ?? selectedNodeId;
    if (activeId && !next.has(activeId)) {
      store.selectNode(null);
      store.setFocusNode(null);
    }
  }, [cityFilterNodeIds]);

  useEffect(() => {
    if (!onSelectionChange) {
      return;
    }
    if (lastEmitted.current === selectedNodeId) {
      return;
    }
    lastEmitted.current = selectedNodeId;
    onSelectionChange(selectedNodeId);
  }, [selectedNodeId, onSelectionChange]);

  return null;
}
