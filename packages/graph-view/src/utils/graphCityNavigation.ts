import type { KnowledgeGraph } from "@novadiff/graph-core/types";
import { resolveGraphNodeFilePath } from "./selectionCluster";

/** Folder container id for a file path (matches folder grouping in containers.ts). */
export function containerIdForFilePath(filePath: string): string | null {
  const slash = filePath.indexOf("/");
  if (slash < 0) {
    return "container:~";
  }
  const top = filePath.slice(0, slash);
  return top ? `container:${top}` : "container:~";
}

export interface GraphCityNavStore {
  enterNovaDiffEmbedDepth: () => void;
  navigateToNodeInLayer: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setFocusNode: (nodeId: string | null) => void;
  expandContainer: (containerId: string) => void;
  collapseAllContainers: () => void;
}

export function applyGraphCityRoot(store: GraphCityNavStore): void {
  store.enterNovaDiffEmbedDepth();
  store.collapseAllContainers();
  store.selectNode(null);
  store.setFocusNode(null);
}

function expandFileContainer(store: GraphCityNavStore, filePath: string | null): void {
  if (!filePath) {
    return;
  }
  const containerId = containerIdForFilePath(filePath);
  if (containerId) {
    store.expandContainer(containerId);
  }
}

export function applyGraphEnterFile(
  store: GraphCityNavStore,
  filePath: string,
  nodeId: string | null,
): void {
  store.enterNovaDiffEmbedDepth();
  store.collapseAllContainers();
  expandFileContainer(store, filePath);
  const targetId = nodeId ?? `file:${filePath}`;
  store.navigateToNodeInLayer(targetId);
  if (nodeId) {
    store.setFocusNode(nodeId);
  }
}

/** Focus graph selection from Documentation ↔ city sync (file = whole file cluster). */
export function applyGraphFocusSelection(
  store: GraphCityNavStore,
  graph: KnowledgeGraph | null,
  nodeId: string,
): void {
  store.enterNovaDiffEmbedDepth();
  const filePath = resolveGraphNodeFilePath(graph, nodeId);
  if (nodeId.startsWith("file:")) {
    store.collapseAllContainers();
    expandFileContainer(store, filePath);
  } else if (filePath) {
    expandFileContainer(store, filePath);
  }
  store.navigateToNodeInLayer(nodeId);
  store.setFocusNode(nodeId);
}
