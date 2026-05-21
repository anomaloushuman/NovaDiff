import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@novadiff/graph-core/types";
import {
  cityBuildingIdsForHighlight,
  cityBuildingToGraphNodeId,
  graphEdgesToCityPairs,
  graphNodeToCityBuildingIds,
} from "../src/app/graphCityBridge";
import type { CodeCityLayoutResult, CodeCityRenderableBuilding } from "../src/app/codeCityLayout";

function building(
  overrides: Partial<CodeCityRenderableBuilding> & { id: string; path: string; name: string },
): CodeCityRenderableBuilding {
  return {
    kind: "function",
    rootSide: "target",
    changeState: "unchanged",
    topDirectory: "src",
    ext: ".ts",
    lineCount: 10,
    owners: [],
    startLine: 1,
    endLine: 10,
    x: 0,
    z: 0,
    width: 2,
    depth: 2,
    height: 4,
    color: 0,
    emissive: 0,
    isGhost: false,
    ...overrides,
  };
}

const layout: CodeCityLayoutResult = {
  districts: [],
  buildings: [
    building({
      id: "target:src/a.ts:function:foo:1",
      path: "src/a.ts",
      name: "foo",
      kind: "function",
      startLine: 1,
    }),
    building({
      id: "target:src/a.ts:class:Bar:10",
      path: "src/a.ts",
      name: "Bar",
      kind: "class",
      startLine: 10,
    }),
  ],
  subsystems: [],
  extensions: [],
  symbolKinds: [],
};

const graph: KnowledgeGraph = {
  version: "1",
  project: { name: "t", path: "/", gitCommitHash: null },
  nodes: [
    { id: "file:src/a.ts", type: "file", name: "a.ts", filePath: "src/a.ts", summary: "", tags: [], complexity: "simple" },
    {
      id: "function:src/a.ts:foo",
      type: "function",
      name: "foo",
      filePath: "src/a.ts",
      summary: "",
      tags: [],
      complexity: "simple",
    },
    {
      id: "class:src/a.ts:Bar",
      type: "class",
      name: "Bar",
      filePath: "src/a.ts",
      summary: "",
      tags: [],
      complexity: "simple",
    },
  ],
  edges: [
    { source: "function:src/a.ts:foo", target: "class:src/a.ts:Bar", type: "calls", direction: "forward", weight: 1 },
  ],
  layers: [],
};

describe("graphCityBridge", () => {
  it("maps function node to city building", () => {
    const ids = graphNodeToCityBuildingIds("function:src/a.ts:foo", graph, layout, "target");
    expect(ids).toContain("target:src/a.ts:function:foo:1");
  });

  it("maps city building back to graph node", () => {
    const b = layout.buildings[0];
    expect(cityBuildingToGraphNodeId(b, graph)).toBe("function:src/a.ts:foo");
  });

  it("highlights all buildings in a file when the file node is selected", () => {
    const { highlightIds } = cityBuildingIdsForHighlight(
      graph,
      layout,
      "target",
      "file:src/a.ts",
      true,
    );
    expect(highlightIds).toContain("target:src/a.ts:function:foo:1");
    expect(highlightIds).toContain("target:src/a.ts:class:Bar:10");
  });

  it("produces edge overlays for selected node", () => {
    const map = new Map([
      ["function:src/a.ts:foo", ["target:src/a.ts:function:foo:1"]],
      ["class:src/a.ts:Bar", ["target:src/a.ts:class:Bar:10"]],
    ]);
    const pairs = graphEdgesToCityPairs(graph, "function:src/a.ts:foo", map, 10);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].type).toBe("calls");
  });
});
