import { describe, expect, it } from "vitest";
import type { KnowledgeGraph } from "@novadiff/graph-core/types";
import { graphNodeIdsInFile, graphSelectionCluster } from "./selectionCluster";

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
      id: "function:src/a.ts:bar",
      type: "function",
      name: "bar",
      filePath: "src/a.ts",
      summary: "",
      tags: [],
      complexity: "simple",
    },
    {
      id: "file:src/b.ts",
      type: "file",
      name: "b.ts",
      filePath: "src/b.ts",
      summary: "",
      tags: [],
      complexity: "simple",
    },
  ],
  edges: [
    { source: "file:src/a.ts", target: "function:src/a.ts:foo", type: "contains", direction: "forward", weight: 1 },
    { source: "file:src/a.ts", target: "function:src/a.ts:bar", type: "contains", direction: "forward", weight: 1 },
    { source: "function:src/a.ts:foo", target: "function:src/a.ts:bar", type: "calls", direction: "forward", weight: 1 },
    { source: "function:src/a.ts:foo", target: "file:src/b.ts", type: "imports", direction: "forward", weight: 1 },
  ],
  layers: [],
};

describe("graphSelectionCluster", () => {
  it("includes every symbol in the file when a file node is selected", () => {
    const cluster = graphSelectionCluster(graph, "file:src/a.ts", graph.edges);
    expect(cluster.has("file:src/a.ts")).toBe(true);
    expect(cluster.has("function:src/a.ts:foo")).toBe(true);
    expect(cluster.has("function:src/a.ts:bar")).toBe(true);
  });

  it("lists all node ids for a file path", () => {
    const ids = graphNodeIdsInFile(graph, "src/a.ts");
    expect(ids).toContain("function:src/a.ts:foo");
    expect(ids).toContain("function:src/a.ts:bar");
    expect(ids).toContain("file:src/a.ts");
  });
});
