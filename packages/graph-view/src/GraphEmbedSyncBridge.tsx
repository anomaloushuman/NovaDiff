import { useEffect, useRef } from "react";
import { useDashboardStore } from "./store";
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
  onSelectionChange,
}: {
  controlledNodeId?: string | null;
  enteredFilePath?: string | null;
  focusMode?: boolean;
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
