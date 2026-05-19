"use strict";

const { spawnSync } = require("node:child_process");

/** @type {Map<string, object>} */
const blameCache = new Map();

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

function blameFileAtRef(repoRoot, ref, relPath) {
  const root = String(repoRoot ?? "").trim();
  const safeRelPath = String(relPath ?? "").trim();
  const gitRef = String(ref ?? "HEAD").trim() || "HEAD";
  if (!root || !safeRelPath) {
    return { lineAuthors: [], owners: [], ref: gitRef, relPath: safeRelPath, error: null };
  }
  const key = `${root}::${gitRef}::${safeRelPath}`;
  const cached = blameCache.get(key);
  if (cached) {
    return cached;
  }
  const res = spawnSync(
    "git",
    ["-C", root, "blame", gitRef, "--line-porcelain", "--", safeRelPath],
    {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    },
  );
  if (res.error || res.status !== 0) {
    const empty = {
      lineAuthors: [],
      owners: [],
      ref: gitRef,
      relPath: safeRelPath,
      error: (res.stderr || res.stdout || "").trim().slice(0, 300) || null,
    };
    blameCache.set(key, empty);
    return empty;
  }
  const parsed = {
    ...parseBlamePorcelain(res.stdout),
    ref: gitRef,
    relPath: safeRelPath,
    error: null,
  };
  blameCache.set(key, parsed);
  return parsed;
}

function blameFileOwnership(root, relPath) {
  return blameFileAtRef(root, "HEAD", relPath);
}

module.exports = { blameFileOwnership, blameFileAtRef, parseBlamePorcelain };
