"use strict";

const path = require("node:path");
const { getRepoStatus, stageAll, commit, push, isGitRepo } = require("./git-service.cjs");
const { createPullRequest, getAuthStatus, slugFromRepoRoot } = require("./github-service.cjs");

function buildFullCommitMessage(subject, body) {
  const s = String(subject ?? "").trim();
  const b = String(body ?? "").trim();
  if (!b) {
    return s;
  }
  return `${s}\n\n${b}`;
}

/**
 * Preview what a publish would do (no mutations).
 */
function previewPublish(repoRoot, opts = {}) {
  const root = path.resolve(String(repoRoot ?? "").trim());
  if (!isGitRepo(root)) {
    throw new Error("Not a git repository");
  }
  const status = getRepoStatus(root);
  const gh = getAuthStatus();
  const slug =
    slugFromRepoRoot(root, status.remotes) ??
    (opts.githubOwner && opts.githubRepo
      ? { owner: opts.githubOwner, repo: opts.githubRepo, host: "github.com" }
      : null);
  return {
    repoRoot: root,
    branch: status.branch,
    upstream: status.upstream,
    ahead: status.ahead,
    behind: status.behind,
    dirtyFiles: status.files,
    remotes: status.remotes,
    github: gh,
    githubSlug: slug,
    canPush: Boolean(status.upstream || status.remotes.some((r) => r.name === "origin")),
  };
}

/**
 * Stage (respects gitignore), commit, optional push and PR.
 */
async function executePublish(repoRoot, opts = {}) {
  const root = path.resolve(String(repoRoot ?? "").trim());
  const subject = String(opts.subject ?? "").trim();
  const body = String(opts.body ?? "").trim();
  if (!subject) {
    throw new Error("Commit subject is required");
  }
  const doPush = Boolean(opts.push);
  const doPr = Boolean(opts.createPullRequest);
  const remote = String(opts.remote ?? "origin").trim() || "origin";

  if (!isGitRepo(root)) {
    throw new Error("Not a git repository");
  }

  stageAll(root);
  const message = buildFullCommitMessage(subject, body);
  const commitHash = commit(root, message);

  const result = {
    ok: true,
    commitHash,
    branch: getRepoStatus(root).branch,
    pushed: false,
    pushRemote: null,
    prUrl: null,
  };

  if (doPush) {
    const pushed = push(root, remote, opts.branch);
    result.pushed = true;
    result.pushRemote = pushed.remote;
    result.branch = pushed.branch;
  }

  if (doPr) {
    const gh = getAuthStatus();
    if (!gh.loggedIn) {
      throw new Error("GitHub CLI not authenticated. Run: gh auth login");
    }
    const prBody =
      String(opts.prBody ?? "").trim() ||
      `${body}\n\n---\n_Auto-published from NovaDiff after human review._`;
    const pr = createPullRequest(root, {
      title: subject,
      body: prBody,
      base: opts.prBase,
      head: opts.prHead,
      draft: Boolean(opts.draftPr),
    });
    result.prUrl = pr.url;
  }

  return result;
}

module.exports = {
  previewPublish,
  executePublish,
  buildFullCommitMessage,
};
