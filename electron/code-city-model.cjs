"use strict";

const { blameFileOwnership } = require("./git-blame.cjs");

function normalizeSide(side) {
  return side === "baseline" ? "baseline" : "target";
}

function dominantAuthor(owners) {
  return Array.isArray(owners) && owners.length > 0 ? owners[0].author : null;
}

function ownershipForRange(lineAuthors, startLine, endLine) {
  if (!Array.isArray(lineAuthors) || lineAuthors.length === 0) {
    return [];
  }
  const start = Math.max(1, Number(startLine) || 1);
  const end = Math.max(start, Number(endLine) || start);
  const counts = new Map();
  for (let line = start; line <= end; line++) {
    const author = lineAuthors[line - 1];
    if (!author) {
      continue;
    }
    counts.set(author, (counts.get(author) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0) || 1;
  return [...counts.entries()]
    .map(([author, lineCount]) => ({
      author,
      lineCount,
      ratio: lineCount / total,
    }))
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 6);
}

function selectBlamePaths(outline, changeKinds, limit = 140) {
  const files = Array.isArray(outline?.files) ? outline.files : [];
  return files
    .slice()
    .sort((a, b) => {
      const aChanged = changeKinds.has(String(a.path ?? "")) ? 1 : 0;
      const bChanged = changeKinds.has(String(b.path ?? "")) ? 1 : 0;
      if (aChanged !== bChanged) {
        return bChanged - aChanged;
      }
      const aScore = Number(a.symbol_count ?? 0) * 100 + Number(a.line_count ?? 0);
      const bScore = Number(b.symbol_count ?? 0) * 100 + Number(b.line_count ?? 0);
      return bScore - aScore || String(a.path ?? "").localeCompare(String(b.path ?? ""));
    })
    .slice(0, limit)
    .map((file) => String(file.path ?? "").trim())
    .filter(Boolean);
}

function buildBlameMap(root, outline, changeKinds) {
  const blame = new Map();
  for (const relPath of selectBlamePaths(outline, changeKinds)) {
    blame.set(relPath, blameFileOwnership(root, relPath));
  }
  return blame;
}

function buildSymbolFileIndex(outline) {
  const map = new Map();
  const entries = Array.isArray(outline?.symbol_spans_by_file)
    ? outline.symbol_spans_by_file
    : [];
  for (const entry of entries) {
    const relPath = String(entry?.path ?? "").trim();
    if (relPath) {
      map.set(relPath, entry);
    }
  }
  return map;
}

function buildSideNodes(side, outline, changeMap, blameMap) {
  const rootSide = normalizeSide(side);
  const files = [];
  const symbols = [];
  const authors = new Set();
  const fileEntries = Array.isArray(outline?.files) ? outline.files : [];
  const symbolFileIndex = buildSymbolFileIndex(outline);
  for (const file of fileEntries) {
    const relPath = String(file?.path ?? "").trim();
    if (!relPath) {
      continue;
    }
    const changeState = changeMap.get(relPath) ?? "unchanged";
    const fileId = `${rootSide}:${relPath}`;
    const blame = blameMap.get(relPath) ?? { lineAuthors: [], owners: [] };
    for (const owner of blame.owners) {
      authors.add(owner.author);
    }
    files.push({
      id: fileId,
      rootSide,
      path: relPath,
      ext: String(file?.ext ?? "(no ext)"),
      topDirectory: String(file?.top_directory ?? "."),
      depth: Number(file?.depth ?? 0),
      lineCount: Number(file?.line_count ?? 0),
      symbolCount: Number(file?.symbol_count ?? 0),
      changeState,
      dominantAuthor: dominantAuthor(blame.owners),
      owners: blame.owners,
    });
    const symbolFile = symbolFileIndex.get(relPath);
    const symbolEntries = Array.isArray(symbolFile?.symbols) ? symbolFile.symbols : [];
    for (const symbol of symbolEntries) {
      const startLine = Number(symbol?.start_line ?? 1);
      const endLine = Number(symbol?.end_line ?? startLine);
      const owners = ownershipForRange(blame.lineAuthors, startLine, endLine);
      for (const owner of owners) {
        authors.add(owner.author);
      }
      symbols.push({
        id: `${rootSide}:${relPath}:${symbol.kind}:${symbol.name}:${startLine}`,
        fileId,
        rootSide,
        path: relPath,
        name: String(symbol?.name ?? ""),
        kind: String(symbol?.kind ?? "symbol"),
        startLine,
        endLine,
        lineCount: Number(symbol?.line_count ?? Math.max(1, endLine - startLine + 1)),
        parentName:
          typeof symbol?.parent_name === "string" ? String(symbol.parent_name) : null,
        parentKind:
          typeof symbol?.parent_kind === "string" ? String(symbol.parent_kind) : null,
        changeState,
        dominantAuthor: dominantAuthor(owners),
        owners,
      });
    }
  }
  return { files, symbols, authors: [...authors] };
}

async function buildCodeCityModelPayload({
  leftRoot,
  rightRoot,
  leftLabel,
  rightLabel,
  changes,
  loadOutline,
}) {
  const changeMap = new Map(
    (Array.isArray(changes) ? changes : [])
      .map((change) => [String(change?.path ?? "").trim(), String(change?.kind ?? "modified")]),
  );
  const changedPaths = new Set([...changeMap.keys()].filter(Boolean));
  const [baselineOutline, targetOutline] = await Promise.all([
    loadOutline(leftRoot),
    loadOutline(rightRoot),
  ]);
  const baselineBlame = buildBlameMap(leftRoot, baselineOutline, changedPaths);
  const targetBlame = buildBlameMap(rightRoot, targetOutline, changedPaths);
  const baseline = buildSideNodes("baseline", baselineOutline, changeMap, baselineBlame);
  const target = buildSideNodes("target", targetOutline, changeMap, targetBlame);
  const authors = [...new Set([...baseline.authors, ...target.authors])].sort((a, b) =>
    a.localeCompare(b),
  );
  return {
    generatedAt: new Date().toISOString(),
    baselineLabel: leftLabel || "Baseline",
    targetLabel: rightLabel || "Target",
    files: [...baseline.files, ...target.files],
    symbols: [...baseline.symbols, ...target.symbols],
    authors,
  };
}

module.exports = { buildCodeCityModelPayload };
