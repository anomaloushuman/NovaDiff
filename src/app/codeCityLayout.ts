import type {
  CodeCityChangeState,
  CodeCityFileNode,
  CodeCityModel,
  CodeCityOwnershipSummary,
  CodeCityRootSide,
  CodeCitySymbolNode,
} from "./types";

export interface CodeCityFilters {
  rootSide: "baseline" | "target";
  compareOverlay: boolean;
  blameOverlay: boolean;
  changedOnly: boolean;
  subsystem: string;
  extension: string;
  symbolKind: string;
  author: string;
  search: string;
}

export interface CodeCityRenderableDistrict {
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  fileCount: number;
}

export interface CodeCityRenderableBuilding {
  id: string;
  path: string;
  name: string;
  kind: string;
  rootSide: CodeCityRootSide;
  changeState: CodeCityChangeState;
  topDirectory: string;
  ext: string;
  lineCount: number;
  owners: CodeCityOwnershipSummary[];
  dominantAuthor?: string | null;
  startLine: number;
  endLine: number;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: number;
  emissive: number;
  isGhost: boolean;
}

export interface CodeCityLayoutResult {
  districts: CodeCityRenderableDistrict[];
  buildings: CodeCityRenderableBuilding[];
  subsystems: string[];
  extensions: string[];
  symbolKinds: string[];
}

const FILE_BLOCK_SIZE = 14;
const FILE_BLOCK_GAP = 4;
const DISTRICT_GAP = 24;
const BUILDING_STEP = 3.2;

function hashColor(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) & 0xffffff;
}

function kindColor(kind: string): number {
  switch (kind) {
    case "class":
      return 0x9b7dff;
    case "interface":
      return 0x7dd3fc;
    case "struct":
      return 0x34d399;
    case "enum":
      return 0xfb7185;
    case "method":
      return 0xfbbf24;
    default:
      return 0x38d9ff;
  }
}

function changeEmissive(changeState: CodeCityChangeState): number {
  switch (changeState) {
    case "added":
      return 0x3cf2aa;
    case "removed":
      return 0xff5f73;
    case "modified":
      return 0x7ee7ff;
    default:
      return 0x1e2f40;
  }
}

function buildingHeight(symbol: CodeCitySymbolNode): number {
  const base = Math.max(1, symbol.lineCount || symbol.endLine - symbol.startLine + 1);
  return 4 + Math.min(38, Math.log2(base + 1) * 5.6);
}

function visibleForRoot(
  symbol: CodeCitySymbolNode,
  selectedRoot: "baseline" | "target",
  compareOverlay: boolean,
): boolean {
  if (symbol.rootSide === selectedRoot) {
    return true;
  }
  if (!compareOverlay) {
    return false;
  }
  if (selectedRoot === "target") {
    return symbol.rootSide === "baseline" && symbol.changeState === "removed";
  }
  return symbol.rootSide === "target" && symbol.changeState === "added";
}

export function buildCodeCityLayout(
  model: CodeCityModel | null,
  filters: CodeCityFilters,
): CodeCityLayoutResult {
  if (!model) {
    return {
      districts: [],
      buildings: [],
      subsystems: [],
      extensions: [],
      symbolKinds: [],
    };
  }
  const fileMap = new Map<string, CodeCityFileNode>();
  for (const file of model.files) {
    fileMap.set(file.id, file);
  }
  const search = filters.search.trim().toLowerCase();
  const visibleSymbols = model.symbols.filter((symbol) => {
    const file = fileMap.get(symbol.fileId);
    if (!file || !visibleForRoot(symbol, filters.rootSide, filters.compareOverlay)) {
      return false;
    }
    if (filters.changedOnly && symbol.changeState === "unchanged") {
      return false;
    }
    if (filters.subsystem !== "all" && file.topDirectory !== filters.subsystem) {
      return false;
    }
    if (filters.extension !== "all" && file.ext !== filters.extension) {
      return false;
    }
    if (filters.symbolKind !== "all" && symbol.kind !== filters.symbolKind) {
      return false;
    }
    if (filters.author !== "all" && symbol.dominantAuthor !== filters.author) {
      return false;
    }
    if (!search) {
      return true;
    }
    return (
      file.path.toLowerCase().includes(search) ||
      symbol.name.toLowerCase().includes(search) ||
      symbol.kind.toLowerCase().includes(search)
    );
  });

  const subsystems = [...new Set(model.files.map((file) => file.topDirectory))].sort((a, b) =>
    a.localeCompare(b),
  );
  const extensions = [...new Set(model.files.map((file) => file.ext))].sort((a, b) =>
    a.localeCompare(b),
  );
  const symbolKinds = [...new Set(model.symbols.map((symbol) => symbol.kind))].sort((a, b) =>
    a.localeCompare(b),
  );

  const byDistrict = new Map<string, Map<string, CodeCitySymbolNode[]>>();
  for (const symbol of visibleSymbols) {
    const file = fileMap.get(symbol.fileId);
    if (!file) {
      continue;
    }
    const district = file.topDirectory || ".";
    const fileGroup = byDistrict.get(district) ?? new Map<string, CodeCitySymbolNode[]>();
    const symbols = fileGroup.get(file.id) ?? [];
    symbols.push(symbol);
    fileGroup.set(file.id, symbols);
    byDistrict.set(district, fileGroup);
  }

  const districts: CodeCityRenderableDistrict[] = [];
  const buildings: CodeCityRenderableBuilding[] = [];
  let cursorX = 0;
  const districtEntries = [...byDistrict.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  for (const [districtName, fileGroups] of districtEntries) {
    const files = [...fileGroups.entries()].sort((a, b) => {
      const fileA = fileMap.get(a[0]);
      const fileB = fileMap.get(b[0]);
      return String(fileA?.path ?? "").localeCompare(String(fileB?.path ?? ""));
    });
    const cols = Math.max(1, Math.ceil(Math.sqrt(files.length)));
    const rows = Math.max(1, Math.ceil(files.length / cols));
    const districtWidth = cols * (FILE_BLOCK_SIZE + FILE_BLOCK_GAP);
    const districtDepth = rows * (FILE_BLOCK_SIZE + FILE_BLOCK_GAP);
    districts.push({
      name: districtName,
      x: cursorX + districtWidth / 2,
      z: districtDepth / 2,
      width: districtWidth,
      depth: districtDepth,
      fileCount: files.length,
    });

    files.forEach(([fileId, symbols], fileIndex) => {
      const file = fileMap.get(fileId);
      if (!file) {
        return;
      }
      const fileCol = fileIndex % cols;
      const fileRow = Math.floor(fileIndex / cols);
      const blockX = cursorX + fileCol * (FILE_BLOCK_SIZE + FILE_BLOCK_GAP);
      const blockZ = fileRow * (FILE_BLOCK_SIZE + FILE_BLOCK_GAP);
      const localCols = Math.max(1, Math.ceil(Math.sqrt(symbols.length)));
      symbols
        .slice()
        .sort((a, b) => a.startLine - b.startLine || a.name.localeCompare(b.name))
        .forEach((symbol, symbolIndex) => {
          const localCol = symbolIndex % localCols;
          const localRow = Math.floor(symbolIndex / localCols);
          const x = blockX + 2 + localCol * BUILDING_STEP;
          const z = blockZ + 2 + localRow * BUILDING_STEP;
          const isGhost = symbol.rootSide !== filters.rootSide;
          const baseColor = filters.blameOverlay && symbol.dominantAuthor
            ? hashColor(symbol.dominantAuthor)
            : kindColor(symbol.kind);
          buildings.push({
            id: symbol.id,
            path: symbol.path,
            name: symbol.name,
            kind: symbol.kind,
            rootSide: symbol.rootSide,
            changeState: symbol.changeState,
            topDirectory: file.topDirectory,
            ext: file.ext,
            lineCount: symbol.lineCount,
            owners: symbol.owners,
            dominantAuthor: symbol.dominantAuthor,
            startLine: symbol.startLine,
            endLine: symbol.endLine,
            x,
            z,
            width: symbol.kind === "class" || symbol.kind === "interface" ? 2.2 : 1.7,
            depth: symbol.kind === "class" || symbol.kind === "interface" ? 2.2 : 1.7,
            height: buildingHeight(symbol),
            color: baseColor,
            emissive: changeEmissive(symbol.changeState),
            isGhost,
          });
        });
    });

    cursorX += districtWidth + DISTRICT_GAP;
  }

  return {
    districts,
    buildings,
    subsystems,
    extensions,
    symbolKinds,
  };
}
