"use strict";

const { runGit, tryRunGit } = require("./git-service.cjs");

/**
 * @param {string} repoRoot
 * @param {string} hash
 */
function getCommitDetail(repoRoot, hash) {
  const root = String(repoRoot ?? "").trim();
  const ref = String(hash ?? "").trim();
  if (!root || !ref) {
    throw new Error("Repository and commit hash are required");
  }

  const metaLine = runGit(root, [
    "log",
    "-1",
    ref,
    "--format=%H%x1f%h%x1f%s%x1f%an%x1f%ae%x1f%aI%x1f%P",
  ]);
  const parts = metaLine.split("\x1f");
  const bodyRaw = runGit(root, ["log", "-1", ref, "--format=%B"]).trim();

  let filesChanged = 0;
  let insertions = 0;
  let deletions = 0;
  const stat = tryRunGit(root, ["show", "--stat", "--format=", ref]);
  if (stat.ok && stat.stdout) {
    const lines = stat.stdout.split("\n");
    const summary = lines[lines.length - 1] ?? "";
    const fileMatch = summary.match(/(\d+)\s+files?\s+changed/);
    const insMatch = summary.match(/(\d+)\s+insertions?\(\+\)/);
    const delMatch = summary.match(/(\d+)\s+deletions?\(-\)/);
    if (fileMatch) {
      filesChanged = Number(fileMatch[1]) || 0;
    }
    if (insMatch) {
      insertions = Number(insMatch[1]) || 0;
    }
    if (delMatch) {
      deletions = Number(delMatch[1]) || 0;
    }
    if (!fileMatch && lines.length > 1) {
      filesChanged = Math.max(0, lines.length - 2);
    }
  }

  const parents = (parts[6] ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    hash: parts[0]?.trim() ?? ref,
    shortHash: parts[1]?.trim() ?? ref.slice(0, 12),
    subject: parts[2]?.trim() ?? "",
    body: bodyRaw,
    authorName: parts[3]?.trim() ?? "",
    authorEmail: parts[4]?.trim() ?? "",
    authoredAt: parts[5]?.trim() ?? "",
    parentHashes: parents,
    filesChanged,
    insertions,
    deletions,
  };
}

module.exports = { getCommitDetail };
