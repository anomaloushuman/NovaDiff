"use strict";

const fssync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

function gitExecutable() {
  return process.platform === "win32" ? "git.exe" : "git";
}

function runGit(cwd, args, opts = {}) {
  const res = spawnSync(gitExecutable(), args, {
    cwd: cwd || undefined,
    encoding: "utf8",
    env: { ...process.env, ...opts.env },
    maxBuffer: 16 * 1024 * 1024,
    timeout: opts.timeoutMs ?? 120_000,
  });
  if (res.error) {
    throw new Error(res.error.message || "Failed to run git");
  }
  if (res.status !== 0) {
    const msg = (res.stderr || res.stdout || "").trim() || `git exited ${res.status}`;
    throw new Error(msg);
  }
  return (res.stdout || "").trim();
}

function tryRunGit(cwd, args) {
  try {
    return { ok: true, stdout: runGit(cwd, args) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function isGitRepo(dir) {
  const root = path.resolve(String(dir ?? "").trim());
  if (!root) {
    return false;
  }
  const r = tryRunGit(root, ["rev-parse", "--git-dir"]);
  return r.ok;
}

function parsePorcelainStatus(stdout) {
  const files = [];
  for (const line of stdout.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const xy = line.slice(0, 2);
    const filePath = line.slice(3).trim();
    if (!filePath) {
      continue;
    }
    const staged = xy[0] !== " " && xy[0] !== "?";
    const unstaged = xy[1] !== " ";
    let status = "modified";
    if (xy.includes("?")) {
      status = "untracked";
    } else if (xy.includes("A")) {
      status = "added";
    } else if (xy.includes("D")) {
      status = "deleted";
    } else if (xy.includes("R")) {
      status = "renamed";
    }
    files.push({ path: filePath, status, staged, unstaged });
  }
  return files;
}

function getRepoStatus(repoRoot) {
  const root = path.resolve(String(repoRoot ?? "").trim());
  if (!isGitRepo(root)) {
    throw new Error("Not a git repository");
  }
  const branch = runGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const head = runGit(root, ["rev-parse", "HEAD"]);
  let upstream = "";
  let ahead = 0;
  let behind = 0;
  const up = tryRunGit(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
  if (up.ok && up.stdout) {
    upstream = up.stdout;
    const counts = tryRunGit(root, ["rev-list", "--left-right", "--count", "HEAD...@{u}"]);
    if (counts.ok) {
      const parts = counts.stdout.split(/\s+/).map((n) => Number(n));
      if (parts.length >= 2) {
        ahead = parts[0] || 0;
        behind = parts[1] || 0;
      }
    }
  }
  const porcelain = tryRunGit(root, ["status", "--porcelain"]);
  const files = porcelain.ok ? parsePorcelainStatus(porcelain.stdout) : [];
  const remotesRaw = tryRunGit(root, ["remote", "-v"]);
  const remotes = [];
  if (remotesRaw.ok) {
    for (const line of remotesRaw.stdout.split("\n")) {
      const m = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
      if (m && m[3] === "fetch") {
        remotes.push({ name: m[1], url: m[2] });
      }
    }
  }
  const rootPrefix = tryRunGit(root, ["rev-parse", "--show-prefix"]);
  return {
    repoRoot: root,
    branch,
    head,
    upstream,
    ahead,
    behind,
    dirty: files.length > 0,
    files,
    remotes,
    subdir: rootPrefix.ok ? rootPrefix.stdout.replace(/\/$/, "") : "",
  };
}

function parseGithubSlugFromUrl(url) {
  const u = String(url ?? "").trim();
  const ssh = u.match(/git@github\.com:([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (ssh) {
    return { owner: ssh[1], repo: ssh[2], host: "github.com" };
  }
  const https = u.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/i);
  if (https) {
    return { owner: https[1], repo: https[2], host: "github.com" };
  }
  return null;
}

function stageAll(repoRoot) {
  const root = path.resolve(repoRoot);
  runGit(root, ["add", "-A"]);
}

function commit(repoRoot, message) {
  const root = path.resolve(repoRoot);
  runGit(root, ["commit", "-m", message]);
  return runGit(root, ["rev-parse", "HEAD"]);
}

function push(repoRoot, remote, branch) {
  const root = path.resolve(repoRoot);
  const r = String(remote ?? "origin").trim() || "origin";
  const b = String(branch ?? "").trim() || runGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  runGit(root, ["push", r, b]);
  return { remote: r, branch: b };
}

function ensureWorktreeBase() {
  const base = path.join(os.tmpdir(), "novadiff-git-worktrees");
  fssync.mkdirSync(base, { recursive: true });
  return base;
}

function removeDirSafe(dir) {
  try {
    fssync.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

/**
 * Create a detached worktree at a ref for folder compare (left side).
 * @returns {string} worktree path
 */
function checkoutRefWorktree(repoRoot, ref, label) {
  const root = path.resolve(repoRoot);
  const base = ensureWorktreeBase();
  const safeLabel = String(label ?? ref).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 48);
  const wtPath = path.join(base, `${path.basename(root)}-${safeLabel}-${Date.now()}`);
  removeDirSafe(wtPath);
  runGit(root, ["worktree", "add", "--detach", wtPath, ref]);
  return wtPath;
}

function cleanupNovadiffWorktrees() {
  removeDirSafe(ensureWorktreeBase());
}

/**
 * Resolve compare roots for PR: base ref vs head ref.
 */
function preparePrCompareRoots(repoRoot, baseRef, headRef) {
  const root = path.resolve(repoRoot);
  const head = String(headRef ?? "HEAD").trim() || "HEAD";
  const base = String(baseRef ?? "origin/main").trim() || "origin/main";
  const leftRoot = checkoutRefWorktree(root, base, "base");
  let rightRoot = root;
  const headResolved = tryRunGit(root, ["rev-parse", head]);
  if (headResolved.ok && headResolved.stdout) {
    const current = tryRunGit(root, ["rev-parse", "HEAD"]);
    if (current.ok && current.stdout !== headResolved.stdout) {
      rightRoot = checkoutRefWorktree(root, head, "head");
    }
  }
  return { leftRoot, rightRoot, baseRef: base, headRef: head };
}

function detectGitTooling() {
  const git = tryRunGit(process.cwd(), ["--version"]);
  return {
    gitAvailable: git.ok,
    gitVersion: git.ok ? git.stdout : null,
    gitError: git.ok ? null : git.error,
  };
}

module.exports = {
  runGit,
  tryRunGit,
  isGitRepo,
  getRepoStatus,
  parseGithubSlugFromUrl,
  stageAll,
  commit,
  push,
  checkoutRefWorktree,
  cleanupNovadiffWorktrees,
  preparePrCompareRoots,
  detectGitTooling,
};
