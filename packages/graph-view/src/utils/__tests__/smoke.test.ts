import { describe, it, expect } from "vitest";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";
import { loadElkConstructor } from "../elk-bundled";

describe("dependency smoke test", () => {
  it("imports elkjs", async () => {
    const ELK = await loadElkConstructor();
    expect(typeof ELK).toBe("function");
  });

  it("imports graphology", () => {
    const g = new Graph();
    g.addNode("a");
    expect(g.order).toBe(1);
  });

  it("imports graphology-communities-louvain", () => {
    expect(typeof louvain).toBe("function");
  });
});
