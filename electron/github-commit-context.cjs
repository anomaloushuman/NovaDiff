"use strict";

const { tryRunGh, getAuthStatus } = require("./github-service.cjs");

function parseJsonSafe(raw, fallback) {
  try {
    return JSON.parse(raw || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function shortGhError(message) {
  const text = String(message ?? "").trim();
  if (!text) {
    return "GitHub request failed";
  }
  if (text.includes("unknown flag") || text.includes("Usage:")) {
    return "GitHub CLI returned an error";
  }
  const first = text.split("\n")[0]?.trim() ?? text;
  return first.length > 140 ? `${first.slice(0, 137)}…` : first;
}

function normalizeThread(entry) {
  return {
    kind: entry.kind,
    number: entry.number,
    author: entry.author ?? "unknown",
    body: String(entry.body ?? "").trim(),
    createdAt: entry.createdAt ?? null,
    url: entry.url ?? null,
  };
}

/**
 * @param {string} fullName owner/repo
 * @param {string} sha
 */
function getGithubCommitContext(fullName, sha) {
  const slug = String(fullName ?? "").trim();
  const commitSha = String(sha ?? "").trim();
  const errors = [];

  if (!slug.includes("/")) {
    throw new Error("Expected owner/repo");
  }
  if (!commitSha) {
    throw new Error("Commit SHA required");
  }

  const auth = getAuthStatus();
  if (!auth.loggedIn) {
    return {
      pullRequests: [],
      issues: [],
      threads: [],
      error: auth.message || "Not signed in to GitHub",
    };
  }

  const [owner, repo] = slug.split("/");
  const pullRequests = [];
  const issues = [];
  const threads = [];

  const pullsRes = tryRunGh([
    "api",
    `repos/${owner}/${repo}/commits/${commitSha}/pulls`,
    "--paginate",
  ]);
  if (pullsRes.ok) {
    const raw = parseJsonSafe(pullsRes.stdout, []);
    const list = Array.isArray(raw) ? raw : [];
    for (const p of list) {
      pullRequests.push({
        number: p.number,
        title: p.title ?? "",
        state: p.state ?? "",
        url: p.html_url ?? p.url ?? "",
      });
    }
  } else {
    errors.push(shortGhError(pullsRes.error || "Failed to load linked pull requests"));
  }

  const issuesRes = tryRunGh([
    "search",
    "issues",
    commitSha,
    "--repo",
    slug,
    "--json",
    "number,title,state,url,isPullRequest",
    "--limit",
    "20",
  ]);
  if (issuesRes.ok) {
    const list = parseJsonSafe(issuesRes.stdout, []);
    for (const i of Array.isArray(list) ? list : []) {
      if (i.isPullRequest) {
        continue;
      }
      issues.push({
        number: i.number,
        title: i.title ?? "",
        state: i.state ?? "",
        url: i.url ?? "",
      });
    }
  } else {
    const fallback = tryRunGh([
      "api",
      "search/issues",
      "-f",
      `q=${encodeURIComponent(`repo:${slug} ${commitSha}`)}`,
      "-f",
      "per_page=20",
    ]);
    if (fallback.ok) {
      const data = parseJsonSafe(fallback.stdout, { items: [] });
      const items = Array.isArray(data.items) ? data.items : [];
      for (const i of items) {
        if (i.pull_request) {
          continue;
        }
        issues.push({
          number: i.number,
          title: i.title ?? "",
          state: i.state ?? "",
          url: i.html_url ?? "",
        });
      }
    } else {
      errors.push("Could not search issues for this commit");
    }
  }

  const prNumbers = new Set(pullRequests.map((p) => p.number));

  for (const pr of pullRequests) {
    const n = pr.number;
    const viewRes = tryRunGh([
      "pr",
      "view",
      String(n),
      "--repo",
      slug,
      "--json",
      "comments,reviews,url",
    ]);
    if (viewRes.ok) {
      const data = parseJsonSafe(viewRes.stdout, {});
      for (const c of Array.isArray(data.comments) ? data.comments : []) {
        threads.push(
          normalizeThread({
            kind: "pr_comment",
            number: n,
            author: c.author?.login ?? c.author ?? "unknown",
            body: c.body ?? "",
            createdAt: c.createdAt ?? null,
            url: data.url ?? pr.url,
          }),
        );
      }
      for (const r of Array.isArray(data.reviews) ? data.reviews : []) {
        if (r.body?.trim()) {
          threads.push(
            normalizeThread({
              kind: "pr_review",
              number: n,
              author: r.author?.login ?? "unknown",
              body: r.body,
              createdAt: r.submittedAt ?? null,
              url: data.url ?? pr.url,
            }),
          );
        }
      }
    }

    const reviewCommentsRes = tryRunGh([
      "api",
      `repos/${owner}/${repo}/pulls/${n}/comments`,
      "--paginate",
    ]);
    if (reviewCommentsRes.ok) {
      const comments = parseJsonSafe(reviewCommentsRes.stdout, []);
      for (const c of Array.isArray(comments) ? comments : []) {
        threads.push(
          normalizeThread({
            kind: "pr_review",
            number: n,
            author: c.user?.login ?? "unknown",
            body: c.body ?? "",
            createdAt: c.created_at ?? null,
            url: c.html_url ?? pr.url,
          }),
        );
      }
    }
  }

  for (const issue of issues) {
    const n = issue.number;
    if (prNumbers.has(n)) {
      continue;
    }
    const commentsRes = tryRunGh([
      "api",
      `repos/${owner}/${repo}/issues/${n}/comments`,
      "--paginate",
    ]);
    if (commentsRes.ok) {
      const comments = parseJsonSafe(commentsRes.stdout, []);
      for (const c of Array.isArray(comments) ? comments : []) {
        threads.push(
          normalizeThread({
            kind: "issue_comment",
            number: n,
            author: c.user?.login ?? "unknown",
            body: c.body ?? "",
            createdAt: c.created_at ?? null,
            url: c.html_url ?? issue.url,
          }),
        );
      }
    }
  }

  threads.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });

  return {
    pullRequests,
    issues,
    threads,
    error: errors.length > 0 ? errors.join("; ") : null,
  };
}

module.exports = { getGithubCommitContext };
