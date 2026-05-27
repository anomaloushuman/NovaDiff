import { describe, expect, it } from "vitest";
import { buildCodeCityLayout } from "../src/app/codeCityLayout";
import type { CodeCityModel } from "../src/app/types";

function modelWithSrcFilesOnly(): CodeCityModel {
  return {
    generatedAt: new Date().toISOString(),
    baselineLabel: "A",
    targetLabel: "B",
    authors: [],
    files: [
      {
        id: "target:src/App.tsx",
        rootSide: "target",
        path: "src/App.tsx",
        ext: ".tsx",
        topDirectory: "src",
        depth: 2,
        lineCount: 120,
        symbolCount: 0,
        changeState: "unchanged",
        dominantAuthor: null,
        owners: [],
      },
      {
        id: "target:src/util.ts",
        rootSide: "target",
        path: "src/util.ts",
        ext: ".ts",
        topDirectory: "src",
        depth: 2,
        lineCount: 40,
        symbolCount: 0,
        changeState: "unchanged",
        dominantAuthor: null,
        owners: [],
      },
    ],
    symbols: [
      {
        id: "target:src/App.tsx:file:App.tsx",
        fileId: "target:src/App.tsx",
        rootSide: "target",
        path: "src/App.tsx",
        name: "App.tsx",
        kind: "file",
        startLine: 1,
        endLine: 120,
        lineCount: 120,
        parentName: null,
        parentKind: null,
        changeState: "unchanged",
        dominantAuthor: null,
        owners: [],
      },
      {
        id: "target:src/util.ts:file:util.ts",
        fileId: "target:src/util.ts",
        rootSide: "target",
        path: "src/util.ts",
        name: "util.ts",
        kind: "file",
        startLine: 1,
        endLine: 40,
        lineCount: 40,
        parentName: null,
        parentKind: null,
        changeState: "unchanged",
        dominantAuthor: null,
        owners: [],
      },
    ],
  };
}

describe("buildCodeCityLayout", () => {
  it("renders buildings for src subsystem when symbols are file-level fallbacks", () => {
    const layout = buildCodeCityLayout(modelWithSrcFilesOnly(), {
      rootSide: "target",
      compareOverlay: true,
      blameOverlay: false,
      changedOnly: false,
      subsystem: "src",
      extension: "all",
      symbolKinds: [],
      changeStates: [],
      author: "all",
      search: "",
    });
    expect(layout.buildings.length).toBe(2);
    expect(layout.buildings.every((b) => b.path.startsWith("src/"))).toBe(true);
  });

  it("matches subsystem paths with backslashes", () => {
    const model = modelWithSrcFilesOnly();
    model.files[0].path = "src\\App.tsx";
    model.symbols[0].path = "src\\App.tsx";
    const layout = buildCodeCityLayout(model, {
      rootSide: "target",
      compareOverlay: false,
      blameOverlay: false,
      changedOnly: false,
      subsystem: "src",
      extension: "all",
      symbolKinds: [],
      changeStates: [],
      author: "all",
      search: "",
    });
    expect(layout.buildings.length).toBeGreaterThan(0);
  });

  it("filters by structure groups and git change state", () => {
    const model = modelWithSrcFilesOnly();
    model.symbols.push({
      id: "target:src/App.tsx:function:main",
      fileId: "target:src/App.tsx",
      rootSide: "target",
      path: "src/App.tsx",
      name: "main",
      kind: "function",
      startLine: 10,
      endLine: 20,
      lineCount: 11,
      parentName: null,
      parentKind: null,
      changeState: "added",
      dominantAuthor: null,
      owners: [],
    });
    const onlyFiles = buildCodeCityLayout(model, {
      rootSide: "target",
      compareOverlay: true,
      blameOverlay: false,
      changedOnly: false,
      subsystem: "all",
      extension: "all",
      symbolKinds: ["file"],
      changeStates: [],
      author: "all",
      search: "",
    });
    expect(onlyFiles.buildings.every((b) => b.kind === "file")).toBe(true);

    const onlyAdded = buildCodeCityLayout(model, {
      rootSide: "target",
      compareOverlay: true,
      blameOverlay: false,
      changedOnly: false,
      subsystem: "all",
      extension: "all",
      symbolKinds: [],
      changeStates: ["added"],
      author: "all",
      search: "",
    });
    expect(onlyAdded.buildings.every((b) => b.changeState === "added")).toBe(true);
  });
});
