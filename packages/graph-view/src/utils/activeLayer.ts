import type { KnowledgeGraph } from "@novadiff/graph-core/types";

/** Synthetic layer id: project-wide class-depth view (all layers merged). */
export const PROJECT_WIDE_LAYER_ID = "__novadiff_project__";

export function resolveActiveLayer(
  graph: KnowledgeGraph,
  activeLayerId: string | null,
): { id: string; name: string; description: string; nodeIds: string[] } | null {
  if (!graph || !activeLayerId) {
    return null;
  }
  if (activeLayerId === PROJECT_WIDE_LAYER_ID) {
    const nodeIds = new Set<string>();
    for (const layer of graph.layers ?? []) {
      for (const nid of layer.nodeIds) {
        nodeIds.add(nid);
      }
    }
    if (nodeIds.size === 0) {
      for (const node of graph.nodes) {
        if (node.layerId) {
          nodeIds.add(node.id);
        }
      }
    }
    return {
      id: PROJECT_WIDE_LAYER_ID,
      name: graph.project?.name ?? "Project",
      description: "All layers",
      nodeIds: [...nodeIds],
    };
  }
  const layer = graph.layers?.find((l) => l.id === activeLayerId);
  if (!layer) {
    return null;
  }
  return {
    id: layer.id,
    name: layer.name,
    description: layer.description,
    nodeIds: layer.nodeIds,
  };
}
