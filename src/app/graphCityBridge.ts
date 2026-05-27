import type { GraphEdge, KnowledgeGraph } from "@novadiff/graph-core/types";
import type {
  CodeCityLayoutResult,
  CodeCityRenderableBuilding,
} from "./codeCityLayout";
import type { CodeCityRootSide } from "./types";

const LINK_EDGE_TYPES = new Set<GraphEdge["type"]>(["imports", "calls", "contains"]);

export interface CityEdgeOverlay {
  sourceBuildingId: string;
  targetBuildingId: string;
  type: GraphEdge["type"];
}

function parseSymbolNodeRest(
  rest: string,
): { filePath: string | null; symbolName: string | null } {
  const parts = rest.split(":");
  if (parts.length < 2) {
    return { filePath: rest || null, symbolName: null };
  }
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && parts.length >= 3) {
    return {
      filePath: parts.slice(0, -2).join(":") || null,
      symbolName: parts[parts.length - 2] ?? null,
    };
  }
  return {
    filePath: parts.slice(0, -1).join(":") || null,
    symbolName: last ?? null,
  };
}

function parseGraphNodeId(nodeId: string): {
  kind: "file" | "function" | "class" | "other";
  filePath: string | null;
  symbolName: string | null;
} {
  if (nodeId.startsWith("file:")) {
    return { kind: "file", filePath: nodeId.slice(5), symbolName: null };
  }
  if (nodeId.startsWith("function:")) {
    const parsed = parseSymbolNodeRest(nodeId.slice("function:".length));
    return { kind: "function", ...parsed };
  }
  if (nodeId.startsWith("class:")) {
    const parsed = parseSymbolNodeRest(nodeId.slice("class:".length));
    return { kind: "class", ...parsed };
  }
  return { kind: "other", filePath: null, symbolName: null };
}

function buildingMatchesSymbol(
  building: CodeCityRenderableBuilding,
  filePath: string,
  symbolName: string | null,
  graphKind: "function" | "class" | "file",
): boolean {
  if (building.path !== filePath) {
    return false;
  }
  if (graphKind === "file") {
    return building.kind === "file" || building.name === building.path.split("/").pop();
  }
  if (!symbolName) {
    return true;
  }
  const kindMatch =
    graphKind === "function"
      ? building.kind === "function" || building.kind === "method"
      : building.kind === "class" || building.kind === "interface" || building.kind === "struct";
  return kindMatch && building.name === symbolName;
}

/** Map a graph node id to visible city building ids (may be multiple symbols on same file). */
export function graphNodeToCityBuildingIds(
  nodeId: string | null,
  graph: KnowledgeGraph | null,
  layout: CodeCityLayoutResult,
  _rootSide?: CodeCityRootSide,
): string[] {
  if (!nodeId || !graph) {
    return [];
  }
  const parsed = parseGraphNodeId(nodeId);
  if (!parsed.filePath) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    const filePath = node?.filePath;
    if (!filePath) {
      return [];
    }
    parsed.filePath = filePath;
    if (!parsed.symbolName && node?.name) {
      parsed.symbolName = node.name;
      if (node.type === "function" || node.type === "method") {
        parsed.kind = "function";
      } else if (node.type === "class") {
        parsed.kind = "class";
      }
    }
  }
  const filePath = parsed.filePath;
  const matches = layout.buildings.filter((b) => {
    if (parsed.kind === "file") {
      return b.path === filePath;
    }
    if (parsed.kind === "function") {
      return buildingMatchesSymbol(b, filePath, parsed.symbolName, "function");
    }
    if (parsed.kind === "class") {
      return buildingMatchesSymbol(b, filePath, parsed.symbolName, "class");
    }
    return b.path === filePath;
  });
  if (matches.length > 0) {
    return matches.map((m) => m.id);
  }
  return layout.buildings.filter((b) => b.path === filePath).map((b) => b.id);
}

/** Reverse: city building → best graph node id. */
export function cityBuildingToGraphNodeId(
  building: CodeCityRenderableBuilding | null,
  graph: KnowledgeGraph | null,
): string | null {
  if (!building || !graph) {
    return null;
  }
  const fileId = `file:${building.path}`;
  if (building.kind === "file") {
    return graph.nodes.some((n) => n.id === fileId) ? fileId : null;
  }
  const symbolKind =
    building.kind === "class" || building.kind === "interface" || building.kind === "struct"
      ? "class"
      : "function";
  const candidates = [
    `${symbolKind}:${building.path}:${building.name}`,
    building.startLine
      ? `${symbolKind}:${building.path}:${building.name}:${building.startLine}`
      : null,
  ].filter(Boolean) as string[];
  for (const id of candidates) {
    if (graph.nodes.some((n) => n.id === id)) {
      return id;
    }
  }
  const byPath = graph.nodes.find(
    (n) =>
      n.filePath === building.path &&
      n.name === building.name &&
      (n.type === symbolKind || n.type === "function" || n.type === "class"),
  );
  if (byPath) {
    return byPath.id;
  }
  return graph.nodes.some((n) => n.id === fileId) ? fileId : null;
}

export function buildBuildingIdByGraphNode(
  graph: KnowledgeGraph | null,
  layout: CodeCityLayoutResult,
  rootSide?: CodeCityRootSide,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!graph) {
    return map;
  }
  for (const node of graph.nodes) {
    const ids = graphNodeToCityBuildingIds(node.id, graph, layout, rootSide);
    if (ids.length > 0) {
      map.set(node.id, ids);
    }
  }
  return map;
}

/** Incident graph edges as city building pairs (capped). */
export function graphEdgesToCityPairs(
  graph: KnowledgeGraph | null,
  nodeId: string | null,
  buildingByNode: Map<string, string[]>,
  maxPairs = 50,
): CityEdgeOverlay[] {
  if (!graph || !nodeId) {
    return [];
  }
  const overlays: CityEdgeOverlay[] = [];
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    if (!LINK_EDGE_TYPES.has(edge.type)) {
      continue;
    }
    if (edge.source !== nodeId && edge.target !== nodeId) {
      continue;
    }
    const srcBuildings = buildingByNode.get(edge.source) ?? [];
    const tgtBuildings = buildingByNode.get(edge.target) ?? [];
    if (srcBuildings.length === 0 || tgtBuildings.length === 0) {
      continue;
    }
    const key = `${srcBuildings[0]}->${tgtBuildings[0]}:${edge.type}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    overlays.push({
      sourceBuildingId: srcBuildings[0],
      targetBuildingId: tgtBuildings[0],
      type: edge.type,
    });
    if (overlays.length >= maxPairs) {
      break;
    }
  }
  return overlays;
}

/** Neighbor graph node ids within 1 hop (link-relevant edges only). */
export function graphNeighborNodeIds(
  graph: KnowledgeGraph | null,
  nodeId: string | null,
): string[] {
  if (!graph || !nodeId) {
    return [];
  }
  const neighbors = new Set<string>();
  for (const edge of graph.edges) {
    if (!LINK_EDGE_TYPES.has(edge.type)) {
      continue;
    }
    if (edge.source === nodeId) {
      neighbors.add(edge.target);
    } else if (edge.target === nodeId) {
      neighbors.add(edge.source);
    }
  }
  return [...neighbors];
}

function filePathForLinkedSelection(
  linkedNodeId: string,
  graph: KnowledgeGraph | null,
  layout: CodeCityLayoutResult,
  primaryIds: string[],
): string | null {
  const primaryBuilding = primaryIds
    .map((id) => layout.buildings.find((b) => b.id === id))
    .find(Boolean);
  if (primaryBuilding) {
    return primaryBuilding.path;
  }
  const parsed = parseGraphNodeId(linkedNodeId);
  if (parsed.filePath) {
    return parsed.filePath;
  }
  const node = graph?.nodes.find((n) => n.id === linkedNodeId);
  return node?.filePath ?? null;
}

/** Graph node ids that correspond to visible Code City buildings (includes parent files). */
export function graphNodeIdsForCityLayout(
  graph: KnowledgeGraph | null,
  layout: CodeCityLayoutResult,
): Set<string> {
  const ids = new Set<string>();
  if (!graph) {
    return ids;
  }
  for (const building of layout.buildings) {
    const nodeId = cityBuildingToGraphNodeId(building, graph);
    if (nodeId) {
      ids.add(nodeId);
    }
    if (building.kind !== "file") {
      const fileId = `file:${building.path.replace(/\\/g, "/")}`;
      if (graph.nodes.some((n) => n.id === fileId)) {
        ids.add(fileId);
      }
    }
  }
  return ids;
}

export function cityBuildingIdsForHighlight(
  graph: KnowledgeGraph | null,
  layout: CodeCityLayoutResult,
  rootSide: CodeCityRootSide,
  linkedNodeId: string | null,
  focusMode: boolean,
  cityBuildingId?: string | null,
): { primary: string | null; highlightIds: string[] } {
  if (!linkedNodeId && cityBuildingId) {
    const building = layout.buildings.find((b) => b.id === cityBuildingId);
    if (!building) {
      return { primary: cityBuildingId, highlightIds: [cityBuildingId] };
    }
    const highlightIds = new Set<string>([cityBuildingId]);
    for (const mate of layout.buildings) {
      if (mate.path === building.path) {
        highlightIds.add(mate.id);
      }
    }
    return { primary: cityBuildingId, highlightIds: [...highlightIds] };
  }

  if (!linkedNodeId) {
    return { primary: null, highlightIds: [] };
  }

  const parsed = parseGraphNodeId(linkedNodeId);
  const primaryIds = graphNodeToCityBuildingIds(linkedNodeId, graph, layout, rootSide);
  let primary = primaryIds[0] ?? cityBuildingId ?? null;
  const highlightIds = new Set<string>(primaryIds);
  if (cityBuildingId) {
    highlightIds.add(cityBuildingId);
    primary = primary ?? cityBuildingId;
  }

  const filePath = filePathForLinkedSelection(linkedNodeId, graph, layout, primaryIds);
  if (parsed.kind === "file" && filePath) {
    const fileBuilding = layout.buildings.find(
      (b) => b.path === filePath && b.kind === "file",
    );
    if (fileBuilding) {
      primary = fileBuilding.id;
    }
  }
  if (filePath) {
    for (const building of layout.buildings) {
      if (building.path === filePath) {
        highlightIds.add(building.id);
      }
    }
  }

  if (focusMode && graph) {
    const seeds = new Set<string>([linkedNodeId]);
    if (filePath) {
      for (const node of graph.nodes) {
        if (node.filePath === filePath) {
          seeds.add(node.id);
        }
      }
    }
    for (const seed of seeds) {
      for (const nid of graphNeighborNodeIds(graph, seed)) {
        for (const bid of graphNodeToCityBuildingIds(nid, graph, layout, rootSide)) {
          highlightIds.add(bid);
        }
      }
    }
  }

  return { primary, highlightIds: [...highlightIds] };
}
