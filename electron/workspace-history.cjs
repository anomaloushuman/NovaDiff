"use strict";

const fsp = require("node:fs/promises");
const fssync = require("node:fs");
const path = require("node:path");
const { runGit } = require("./git-service.cjs");

function removeDirSafe(dir) {
  try {
    if (fssync.existsSync(dir)) {
      fssync.rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    /* ignore */
  }
}

function isUsableSnapshotDir(destDir) {
  if (!destDir || !fssync.existsSync(destDir)) {
    return false;
  }
  try {
    const st = fssync.statSync(destDir);
    if (!st.isDirectory()) {
      return false;
    }
    const entries = fssync.readdirSync(destDir);
    return entries.length > 0;
  } catch {
    return false;
  }
}
const { upsertWorkspace, getWorkspace } = require("./workspace-store.cjs");

function listCommitsOldestFirst(repoRoot) {
  const out = runGit(repoRoot, [
    "log",
    "--reverse",
    "--format=%H%x1f%s%x1f%aI",
  ]);
  const commits = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const parts = line.split("\x1f");
    const hash = parts[0]?.trim();
    if (!hash) {
      continue;
    }
    commits.push({
      hash,
      shortHash: hash.slice(0, 12),
      subject: parts[1] ?? "",
      authoredAt: parts[2] ?? "",
    });
  }
  return commits;
}

async function snapshotCommit(repoRoot, hash, destDir) {
  const root = path.resolve(String(repoRoot ?? "").trim());
  const ref = String(hash ?? "").trim();
  const dest = path.resolve(String(destDir ?? "").trim());
  if (!root || !ref || !dest) {
    throw new Error("Repository, commit, and snapshot path are required");
  }
  if (isUsableSnapshotDir(dest)) {
    return dest;
  }
  removeDirSafe(dest);
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  runGit(root, ["worktree", "add", "--detach", dest, ref]);
  if (!isUsableSnapshotDir(dest)) {
    throw new Error(`Failed to materialize snapshot at ${dest}`);
  }
  return dest;
}

async function ensureCommitSnapshot(userData, workspaceId, hash, snapshotPath) {
  const workspace = await getWorkspace(userData, workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  const dest = path.resolve(String(snapshotPath ?? "").trim());
  if (!dest) {
    throw new Error("Snapshot path is required");
  }
  const snapPath = await snapshotCommit(workspace.repoRoot, hash, dest);
  const commits = Array.isArray(workspace.commits) ? workspace.commits : [];
  const idx = commits.findIndex((c) => c.hash === hash);
  if (idx >= 0) {
    commits[idx].snapshotPath = snapPath;
    workspace.commits = commits;
    await upsertWorkspace(userData, workspace);
  }
  return { snapshotPath: snapPath, ready: true };
}

async function indexWorkspaceHistory(userData, workspaceId, sendProgress) {
  const workspace = await getWorkspace(userData, workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }
  const repoRoot = workspace.repoRoot;
  const commits = listCommitsOldestFirst(repoRoot);
  const total = commits.length;
  const snapshots = [];

  workspace.historyStatus = "indexing";
  workspace.historyError = null;
  workspace.historyProgress = { current: 0, total, message: "Starting…" };
  await upsertWorkspace(userData, workspace);
  sendProgress?.({
    workspaceId,
    current: 0,
    total,
    message: "Starting…",
  });

  let previousSnap = null;
  for (let i = 0; i < commits.length; i++) {
    const c = commits[i];
    const snapDir = path.join(workspace.dataDir, "snapshots", c.shortHash);
    const docsDir = path.join(workspace.dataDir, "docs", c.shortHash);
    const msg = `Snapshot ${i + 1}/${total}: ${c.shortHash}`;
    sendProgress?.({
      workspaceId,
      current: i,
      total,
      message: msg,
      hash: c.hash,
    });
    workspace.historyProgress = { current: i + 1, total, message: msg };
    await upsertWorkspace(userData, workspace);

    await snapshotCommit(repoRoot, c.hash, snapDir);
    await fsp.mkdir(docsDir, { recursive: true });
    await fsp.writeFile(
      path.join(docsDir, "commit-meta.json"),
      `${JSON.stringify({ ...c, index: i, previousHash: previousSnap?.hash ?? null }, null, 2)}\n`,
      "utf8",
    );
  if (previousSnap) {
      await fsp.writeFile(
        path.join(docsDir, "README.md"),
        `# ${c.subject}\n\nCommit \`${c.shortHash}\` · ${c.authoredAt}\n\nDocumentation bundle for this revision (compare against parent snapshot in NovaDiff history view).\n`,
        "utf8",
      );
    } else {
      await fsp.writeFile(
        path.join(docsDir, "README.md"),
        `# ${c.subject}\n\nInitial commit \`${c.shortHash}\` · ${c.authoredAt}\n`,
        "utf8",
      );
    }

    snapshots.push({
      hash: c.hash,
      shortHash: c.shortHash,
      subject: c.subject,
      authoredAt: c.authoredAt,
      snapshotPath: snapDir,
      docsPath: docsDir,
      indexedAt: new Date().toISOString(),
    });
    previousSnap = { hash: c.hash, snapDir };
  }

  workspace.commits = snapshots;
  workspace.historyStatus = "ready";
  workspace.historyProgress = { current: total, total, message: "History ready" };
  workspace.updatedAt = new Date().toISOString();
  await upsertWorkspace(userData, workspace);
  sendProgress?.({
    workspaceId,
    current: total,
    total,
    message: "Complete",
    done: true,
  });
  return workspace;
}

module.exports = {
  listCommitsOldestFirst,
  indexWorkspaceHistory,
  snapshotCommit,
  ensureCommitSnapshot,
  isUsableSnapshotDir,
};
