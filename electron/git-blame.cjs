"use strict";

const { spawnSync } = require("node:child_process");

/** @type {Map<string, { lineAuthors: string[]; owners: Array<{ author: string; lineCount: number; ratio: number }> }>} */
const blameCache = new Map();

function cacheKey(root, relPath) {
  return `${root}::${relPath}`;
}

function parseBlamePorcelain(stdout) {
  const lines = String(stdout ?? "").split(/\r?\n/);
  const lineAuthors = [];
  let currentAuthor = "Unknown";
  for (const line of lines) {
    if (line.startsWith("author ")) {
      currentAuthor = line.slice("author ".length).trim() || "Unknown";
      continue;
    }
    if (line.startsWith("\t")) {
      lineAuthors.push(currentAuthor);
    }
  }
  const counts = new Map();
  for (const author of lineAuthors) {
    counts.set(author, (counts.get(author) ?? 0) + 1);
  }
  const total = lineAuthors.length || 1;
  const owners = [...counts.entries()]
    .map(([author, lineCount]) => ({
      author,
      lineCount,
      ratio: lineCount / total,
    }))
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 8);
  return { lineAuthors, owners };
}

function blameFileOwnership(root, relPath) {
  const repoRoot = String(root ?? "").trim();
  const safeRelPath = String(relPath ?? "").trim();
  if (!repoRoot || !safeRelPath) {
    return { lineAuthors: [], owners: [] };
  }
  const key = cacheKey(repoRoot, safeRelPath);
  const cached = blameCache.get(key);
  if (cached) {
    return cached;
  }
  const res = spawnSync("git", ["-C", repoRoot, "blame", "--line-porcelain", "--", safeRelPath], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true,
  });
  if (res.error || res.status !== 0) {
    const empty = { lineAuthors: [], owners: [] };
    blameCache.set(key, empty);
    return empty;
  }
  const parsed = parseBlamePorcelain(res.stdout);
  blameCache.set(key, parsed);
  return parsed;
}

module.exports = { blameFileOwnership };
