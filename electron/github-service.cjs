"use strict";

const { spawnSync } = require("node:child_process");
const { parseGithubSlugFromUrl } = require("./git-service.cjs");
const {
  augmentPathForCli,
  resolveGhExecutable,
  ghNotFoundError,
} = require("./gh-path.cjs");

function runGh(args, opts = {}) {
  const gh = resolveGhExecutable();
  const env = augmentPathForCli();
  const res = spawnSync(gh, args, {
    encoding: "utf8",
    env,
    maxBuffer: 8 * 1024 * 1024,
    timeout: opts.timeoutMs ?? 90_000,
  });
  if (res.error) {
    throw res.error.code === "ENOENT" ? ghNotFoundError() : new Error(res.error.message);
  }
  if (res.status !== 0) {
    const msg = (res.stderr || res.stdout || "").trim() || `gh exited ${res.status}`;
    throw new Error(msg);
  }
  return (res.stdout || "").trim();
}

function tryRunGh(args) {
  try {
    return { ok: true, stdout: runGh(args) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function isGhAvailable() {
  const v = tryRunGh(["--version"]);
  return v.ok;
}

function getAuthStatus() {
  if (!isGhAvailable()) {
    return {
      available: false,
      loggedIn: false,
      user: null,
      hostname: "github.com",
      scopes: [],
      message: "Install GitHub CLI (gh) and run: gh auth login",
    };
  }
  const st = tryRunGh(["auth", "status", "--hostname", "github.com"]);
  if (!st.ok) {
    return {
      available: true,
      loggedIn: false,
      user: null,
      hostname: "github.com",
      scopes: [],
      message: st.error || "Not logged in. Run: gh auth login",
    };
  }
  const userMatch = st.stdout.match(/account\s+(\S+)/i);
  const user = userMatch ? userMatch[1] : null;
  return {
    available: true,
    loggedIn: true,
    user,
    hostname: "github.com",
    scopes: [],
    message: user ? `Signed in as ${user}` : "Signed in to GitHub",
  };
}

function listRepos(limit = 40) {
  const out = runGh([
    "repo",
    "list",
    "--limit",
    String(limit),
    "--json",
    "name,owner,isFork,updatedAt,url,defaultBranchRef,sshUrl,parent",
  ]);
  return JSON.parse(out || "[]").map((r) => ({
    owner: r.owner?.login ?? "",
    name: r.name ?? "",
    fullName: `${r.owner?.login ?? ""}/${r.name ?? ""}`,
    url: r.url ?? "",
    sshUrl: r.sshUrl ?? "",
    defaultBranch: r.defaultBranchRef?.name ?? "main",
    isFork: Boolean(r.isFork),
    updatedAt: r.updatedAt ?? null,
  }));
}

function listPullRequests(fullName, state = "open", limit = 30) {
  const slug = String(fullName ?? "").trim();
  if (!slug.includes("/")) {
    throw new Error("Expected owner/repo");
  }
  const out = runGh([
    "pr",
    "list",
    "--repo",
    slug,
    "--state",
    state,
    "--limit",
    String(limit),
    "--json",
    "number,title,state,url,headRefName,baseRefName,author,updatedAt,isDraft",
  ]);
  return JSON.parse(out || "[]").map((p) => ({
    number: p.number,
    title: p.title ?? "",
    state: p.state ?? "",
    url: p.url ?? "",
    headRef: p.headRefName ?? "",
    baseRef: p.baseRefName ?? "",
    author: p.author?.login ?? "",
    updatedAt: p.updatedAt ?? null,
    isDraft: Boolean(p.isDraft),
    repository: slug,
  }));
}

function viewPullRequest(fullName, number) {
  const out = runGh([
    "pr",
    "view",
    String(number),
    "--repo",
    fullName,
    "--json",
    "number,title,body,state,url,headRefName,baseRefName,headRepository,baseRepository",
  ]);
  return JSON.parse(out || "{}");
}

function createPullRequest(repoRoot, opts) {
  const title = String(opts?.title ?? "").trim();
  const body = String(opts?.body ?? "").trim();
  const base = String(opts?.base ?? "").trim();
  const head = String(opts?.head ?? "").trim();
  const draft = Boolean(opts?.draft);
  const args = ["pr", "create", "--title", title, "--body", body];
  if (base) {
    args.push("--base", base);
  }
  if (head) {
    args.push("--head", head);
  }
  if (draft) {
    args.push("--draft");
  }
  const out = runGh(args, { cwd: repoRoot });
  const urlMatch = out.match(/https:\/\/github\.com\/\S+/);
  return { url: urlMatch ? urlMatch[0] : out, raw: out };
}

function getUserProfile() {
  const auth = getAuthStatus();
  if (!auth.loggedIn) {
    throw new Error(auth.message || "Not signed in to GitHub");
  }
  const out = runGh(["api", "user", "--hostname", "github.com"]);
  const user = JSON.parse(out || "{}");
  return {
    login: user.login ?? auth.user ?? "unknown",
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
    hostname: "github.com",
    authenticatedAt: new Date().toISOString(),
  };
}

function listDetectedAccounts() {
  const auth = getAuthStatus();
  if (!auth.loggedIn) {
    return [];
  }
  try {
    const profile = getUserProfile();
    return [profile];
  } catch {
    if (auth.user) {
      return [
        {
          login: auth.user,
          name: null,
          avatarUrl: `https://github.com/${auth.user}.png`,
          hostname: "github.com",
          authenticatedAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  }
}

function slugFromRepoRoot(repoRoot, getRemotes) {
  for (const remote of getRemotes) {
    const slug = parseGithubSlugFromUrl(remote.url);
    if (slug) {
      return { ...slug, remote: remote.name };
    }
  }
  return null;
}

module.exports = {
  isGhAvailable,
  getAuthStatus,
  getUserProfile,
  listDetectedAccounts,
  listRepos,
  listPullRequests,
  viewPullRequest,
  createPullRequest,
  slugFromRepoRoot,
  tryRunGh,
};
