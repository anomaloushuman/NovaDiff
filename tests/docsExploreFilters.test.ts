import { describe, expect, it } from "vitest";
import {
  graphDetailFromSymbolKinds,
  symbolMatchesKindGroups,
  toggleSymbolKindGroup,
} from "../src/app/docsExploreFilters";

describe("docsExploreFilters", () => {
  it("maps structure toggles to graph detail level", () => {
    expect(graphDetailFromSymbolKinds(["file"])).toEqual({
      detailLevel: "file",
      showFunctionsInClassView: false,
    });
    expect(graphDetailFromSymbolKinds(["class"])).toEqual({
      detailLevel: "class",
      showFunctionsInClassView: false,
    });
    expect(graphDetailFromSymbolKinds(["function"])).toEqual({
      detailLevel: "class",
      showFunctionsInClassView: true,
    });
    expect(graphDetailFromSymbolKinds(["class", "function"])).toEqual({
      detailLevel: "class",
      showFunctionsInClassView: true,
    });
  });

  it("matches symbol kinds to structure groups", () => {
    expect(symbolMatchesKindGroups("file", ["file"])).toBe(true);
    expect(symbolMatchesKindGroups("class", ["file"])).toBe(false);
    expect(symbolMatchesKindGroups("method", ["function"])).toBe(true);
    expect(symbolMatchesKindGroups("interface", ["class"])).toBe(true);
  });

  it("keeps at least one structure group enabled", () => {
    expect(toggleSymbolKindGroup(["file", "class", "function"], "file")).toEqual([
      "class",
      "function",
    ]);
    expect(toggleSymbolKindGroup(["function"], "function")).toEqual(["function"]);
  });
});
