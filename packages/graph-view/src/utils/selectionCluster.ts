import type { GraphEdge, KnowledgeGraph } from "@novadiff/graph-core/types";

const LINK_EDGE_TYPES = new Set<GraphEdge["type"]>(["imports", "calls", "contains"]);

function filePathFromNodeId(nodeId: string): string | null {
  if (nodeId.startsWith("file:")) {
    return nodeId.slice(5);
  }
  if (nodeId.startsWith("function:") || nodeId.startsWith("class:")) {
    const rest = nodeId.slice(nodeId.indexOf(":") + 1);
    const lastColon = rest.lastIndexOf(":");
    return lastColon > 0 ? rest.slice(0, lastColon) : rest;
  }
  return null;
}

export function resolveGraphNodeFilePath(
  graph: KnowledgeGraph | null,
  nodeId: string | null,
): string | null {
  if (!nodeId) {
    return null;
  }
  const node = graph?.nodes.find((n) => n.id === nodeId);
  if (node?.filePath) {
    return node.filePath;
  }
  return filePathFromNodeId(nodeId);
}

/** All symbol + file node ids that belong to the same file path. */
export function graphNodeIdsInFile(
  graph: KnowledgeGraph | null,
  filePath: string | null,
): string[] {
  if (!graph || !filePath) {
    return [];
  }
  const ids: string[] = [];
  for (const node of graph.nodes) {
    if (node.filePath === filePath) {
      ids.push(node.id);
    }
  }
  const fileId = `file:${filePath}`;
  if (graph.nodes.some((n) => n.id === fileId)) {
    ids.push(fileId);
  }
  return [...new Set(ids)];
}

/**
 * Selection/focus cluster: same-file symbols, file node, plus one-hop neighbors
 * over link-relevant edges (imports, calls, contains).
 */
export function graphSelectionCluster(
  graph: KnowledgeGraph | null,
  nodeId: string | null,
  edges: GraphEdge[],
): Set<string> {
  const cluster = new Set<string>();
  if (!nodeId) {
    return cluster;
  }
  cluster.add(nodeId);

  const filePath = resolveGraphNodeFilePath(graph, nodeId);
  if (filePath) {
    for (const id of graphNodeIdsInFile(graph, filePath)) {
      cluster.add(id);
    }
  }

  const neighborhood = new Set<string>(cluster);
  for (const edge of edges) {
    if (!LINK_EDGE_TYPES.has(edge.type)) {
      continue;
    }
    if (cluster.has(edge.source)) {
      neighborhood.add(edge.target);
    }
    if (cluster.has(edge.target)) {
      neighborhood.add(edge.source);
    }
  }
  return neighborhood;
}
