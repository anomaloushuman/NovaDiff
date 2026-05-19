"use strict";

const fssync = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { parseGithubSlugFromUrl, tryRunGit } = require("./git-service.cjs");

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "Library",
  "AppData",
  "Applications",
  ".Trash",
  "Caches",
  "Cache",
  "tmp",
  "temp",
  "vendor",
  "target",
  "dist",
  "build",
  ".novadiff-graph",
]);

const MAX_REPOS = 120;
const MAX_DEPTH = 4;

function homeSearchRoots() {
  const home = os.homedir();
  const candidates = [
    path.join(home, "Documents"),
    path.join(home, "Documents", "GitHub"),
    path.join(home, "Projects"),
    path.join(home, "Developer"),
    path.join(home, "dev"),
    path.join(home, "src"),
    path.join(home, "code"),
    path.join(home, "GitHub"),
    path.join(home, "git"),
    path.join(home, "repos"),
    path.join(home, "workspace"),
    path.join(home, "work"),
  ];
  if (process.platform === "win32") {
    candidates.push(path.join(home, "source", "repos"));
  }
  if (process.platform === "linux") {
    candidates.push(path.join(home, "git-repos"));
  }
  const seen = new Set();
  const roots = [];
  for (const c of candidates) {
    const resolved = path.resolve(c);
    if (seen.has(resolved)) {
      continue;
    }
    seen.add(resolved);
    try {
      if (fssync.statSync(resolved).isDirectory()) {
        roots.push(resolved);
      }
    } catch {
      /* skip */
    }
  }
  return roots;
}

function readGitRemoteSlug(repoRoot) {
  const remotes = tryRunGit(repoRoot, ["remote", "-v"]);
  if (!remotes.ok) {
    return null;
  }
  for (const line of remotes.stdout.split("\n")) {
    const m = line.match(/^(\S+)\s+(\S+)\s+\(fetch\)$/);
    if (!m) {
      continue;
    }
    const slug = parseGithubSlugFromUrl(m[2]);
    if (slug) {
      return { ...slug, remote: m[1], url: m[2] };
    }
  }
  return null;
}

function scanForGitRepos(roots, opts = {}) {
  const targetSlug = opts.targetSlug
    ? `${opts.targetSlug.owner}/${opts.targetSlug.repo}`.toLowerCase()
    : null;
  const found = [];
  const seen = new Set();

  function walk(dir, depth) {
    if (found.length >= MAX_REPOS || depth > MAX_DEPTH) {
      return;
    }
    let entries;
    try {
      entries = fssync.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const hasGit = entries.some((e) => e.isDirectory() && e.name === ".git");
    if (hasGit) {
      const repoRoot = path.resolve(dir);
      if (!seen.has(repoRoot)) {
        seen.add(repoRoot);
        const slug = readGitRemoteSlug(repoRoot);
        const fullName = slug ? `${slug.owner}/${slug.repo}` : null;
        if (!targetSlug || (fullName && fullName.toLowerCase() === targetSlug)) {
          found.push({
            path: repoRoot,
            name: path.basename(repoRoot),
            slug: fullName,
            remoteUrl: slug?.url ?? null,
          });
        }
      }
      return;
    }
    for (const ent of entries) {
      if (!ent.isDirectory()) {
        continue;
      }
      if (SKIP_DIR_NAMES.has(ent.name) || ent.name.startsWith(".")) {
        continue;
      }
      walk(path.join(dir, ent.name), depth + 1);
    }
  }

  for (const root of roots) {
    walk(root, 0);
    if (found.length >= MAX_REPOS) {
      break;
    }
  }
  return found;
}

function discoverRepos(payload = {}) {
  const extraRoots = Array.isArray(payload.extraRoots)
    ? payload.extraRoots.map((r) => path.resolve(String(r)))
    : [];
  const roots = [...new Set([...homeSearchRoots(), ...extraRoots])];
  const target = payload.owner && payload.repo ? { owner: payload.owner, repo: payload.repo } : null;
  const matches = scanForGitRepos(roots, { targetSlug: target });
  return {
    searchRoots: roots,
    matches,
    scannedAt: new Date().toISOString(),
  };
}

function matchRepoForGithubRepo(owner, repo, extraRoots = []) {
  return discoverRepos({ owner, repo, extraRoots }).matches;
}

module.exports = {
  homeSearchRoots,
  discoverRepos,
  matchRepoForGithubRepo,
  readGitRemoteSlug,
};
