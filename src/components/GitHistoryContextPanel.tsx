import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen,
  Copy,
  ExternalLink,
  GitBranch,
  GitCompareArrows,
  Loader2,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import type {
  GitCommitDetail,
  GithubCommitContext,
} from "../app/gitTypes";
import type { NovaWorkspace, WorkspaceCommitSnapshot } from "../app/workspaceTypes";
import { GitBlamePanel } from "./GitBlamePanel";

type ContextTab = "details" | "github" | "actions";

export interface GitHistoryContextPanelProps {
  workspace: NovaWorkspace;
  focusCommit: WorkspaceCommitSnapshot | null;
  base: WorkspaceCommitSnapshot | null;
  head: WorkspaceCommitSnapshot | null;
  useLiveHead: boolean;
  busy: boolean;
  localOnlyMode: boolean;
  canCompare: boolean;
  onSetBase: (hash: string) => void;
  onSetHead: (hash: string) => void;
  onCompare: () => void;
  onDocument: (base: WorkspaceCommitSnapshot, head: WorkspaceCommitSnapshot) => void;
  onOpenSettings?: () => void;
  onReviewInCity?: () => void;
}

function formatDate(iso: string): string {
  if (!iso) {
    return "—";
  }
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

function slugFromRemoteUrl(url: string): string | null {
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?\/?$/i);
  if (!m) {
    return null;
  }
  return `${m[1]}/${m[2]}`;
}

function friendlyGhError(raw: string | null | undefined): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const text = raw.trim();
  if (text.includes("unknown flag") || text.includes("Usage:")) {
    return "Some GitHub data could not be loaded. Pull requests and discussion may still appear below.";
  }
  if (text.length > 280) {
    return `${text.slice(0, 277)}…`;
  }
  return text;
}

function threadKindLabel(kind: string): string {
  if (kind === "pr_review") {
    return "PR review";
  }
  if (kind === "pr_comment") {
    return "PR comment";
  }
  if (kind === "issue_comment") {
    return "Issue comment";
  }
  return kind;
}

export function GitHistoryContextPanel({
  workspace,
  focusCommit,
  base,
  head,
  useLiveHead,
  busy,
  localOnlyMode,
  canCompare,
  onSetBase,
  onSetHead,
  onCompare,
  onDocument,
  onOpenSettings,
  onReviewInCity,
}: GitHistoryContextPanelProps) {
  const api = window.electronAPI;
  const [tab, setTab] = useState<ContextTab>("details");
  const [detail, setDetail] = useState<GitCommitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [ghContext, setGhContext] = useState<GithubCommitContext | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghError, setGhError] = useState<string | null>(null);
  const [blameOpen, setBlameOpen] = useState(false);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [repository, setRepository] = useState<string | null>(
    workspace.githubSlug?.includes("/") ? workspace.githubSlug : null,
  );

  useEffect(() => {
    if (workspace.githubSlug?.includes("/")) {
      setRepository(workspace.githubSlug);
      return;
    }
    if (!api?.gitRepoStatus) {
      setRepository(null);
      return;
    }
    void api.gitRepoStatus({ repoRoot: workspace.repoRoot }).then((st) => {
      for (const remote of st.remotes) {
        const slug = slugFromRemoteUrl(remote.url);
        if (slug) {
          setRepository(slug);
          return;
        }
      }
      setRepository(null);
    }).catch(() => setRepository(null));
  }, [api, workspace.githubSlug, workspace.repoRoot]);

  const parentOf = useCallback(
    (commit: WorkspaceCommitSnapshot) => {
      const sorted = [...(workspace.commits ?? [])].sort((a, b) =>
        a.authoredAt.localeCompare(b.authoredAt),
      );
      const idx = sorted.findIndex((c) => c.hash === commit.hash);
      return idx > 0 ? sorted[idx - 1] : null;
    },
    [workspace.commits],
  );

  useEffect(() => {
    setBlameOpen(false);
    setDetail(null);
    setGhContext(null);
    setDetailError(null);
    setGhError(null);
  }, [focusCommit?.hash]);

  useEffect(() => {
    if (!focusCommit?.hash || !api?.gitCommitDetail) {
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError(null);
    void api
      .gitCommitDetail({ repoRoot: workspace.repoRoot, hash: focusCommit.hash })
      .then((d) => {
        if (!controller.signal.aborted) {
          setDetail(d);
        }
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setDetailError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDetailLoading(false);
        }
      });
    return () => controller.abort();
  }, [api, focusCommit?.hash, workspace.repoRoot]);

  useEffect(() => {
    if (tab !== "github" || !focusCommit?.hash || !repository || localOnlyMode) {
      return;
    }
    if (!api?.githubCommitContext) {
      setGhError("GitHub integration requires the NovaDiff desktop app.");
      return;
    }
    const controller = new AbortController();
    setGhLoading(true);
    setGhError(null);
    setGhContext(null);
    void api
      .githubCommitContext({ repository, sha: focusCommit.hash })
      .then((ctx) => {
        if (!controller.signal.aborted) {
          setGhContext(ctx);
          if (ctx.error) {
            setGhError(ctx.error);
          }
        }
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setGhError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setGhLoading(false);
        }
      });
    return () => controller.abort();
  }, [api, tab, focusCommit?.hash, repository, localOnlyMode]);

  const copyHash = useCallback(async () => {
    if (!focusCommit?.hash) {
      return;
    }
    try {
      await navigator.clipboard.writeText(focusCommit.hash);
      setCopyHint("Copied");
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint("Copy failed");
    }
  }, [focusCommit?.hash]);

  const isBase = focusCommit?.hash === base?.hash;
  const isHead = focusCommit?.hash === head?.hash && !useLiveHead;
  const parent = focusCommit ? parentOf(focusCommit) : null;

  const emptyMessage = useMemo(() => {
    if (!focusCommit) {
      return "Select a commit in the list to view details, GitHub activity, and actions.";
    }
    return null;
  }, [focusCommit]);

  const blameOverlay =
    blameOpen && focusCommit
      ? createPortal(
          <div
            className="git-blame-overlay"
            role="presentation"
            onMouseDown={() => setBlameOpen(false)}
          >
            <div
              className="git-blame-overlay-panel"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GitBlamePanel
                repoRoot={workspace.repoRoot}
                commit={focusCommit}
                onClose={() => setBlameOpen(false)}
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {blameOverlay}
    <aside className="git-history-context insights">
      <div className="insights-tabs">
        <button
          type="button"
          className={tab === "details" ? "insights-tab active" : "insights-tab"}
          onClick={() => setTab("details")}
        >
          <Sparkles size={15} strokeWidth={2} className="insights-tab-icon" aria-hidden />
          Details
        </button>
        <button
          type="button"
          className={tab === "github" ? "insights-tab active" : "insights-tab"}
          onClick={() => setTab("github")}
        >
          <MessageSquare size={15} strokeWidth={2} className="insights-tab-icon" aria-hidden />
          GitHub
        </button>
        <button
          type="button"
          className={tab === "actions" ? "insights-tab active" : "insights-tab"}
          onClick={() => setTab("actions")}
        >
          <Zap size={15} strokeWidth={2} className="insights-tab-icon" aria-hidden />
          Actions
        </button>
      </div>

      <div className="insights-scroll git-history-context-scroll">
        {emptyMessage ? (
          <p className="insights-prose doc-workspace-muted">{emptyMessage}</p>
        ) : null}

        {focusCommit && tab === "details" ? (
          <div key="details" className="insights-panel-enter">
            <section className="git-history-detail-card">
              <p className="git-history-detail-eyebrow">Commit</p>
              <div className="git-history-context-badges">
                {isBase ? <span className="git-history-badge">Base</span> : null}
                {isHead ? (
                  <span className="git-history-badge git-history-badge--head">Head</span>
                ) : null}
              </div>
              <h3 className="git-history-context-subject">{focusCommit.subject}</h3>
              <div className="git-history-context-hash-row">
                <code className="git-history-context-hash">{focusCommit.hash}</code>
                <button
                  type="button"
                  className="git-history-copy-btn"
                  onClick={() => void copyHash()}
                  title="Copy full hash"
                >
                  <Copy size={14} aria-hidden />
                  {copyHint ?? "Copy"}
                </button>
              </div>
              {detailLoading ? (
                <p className="doc-workspace-muted">
                  <Loader2 size={14} className="spin-ic" aria-hidden /> Loading…
                </p>
              ) : null}
              {detailError ? <p className="insights-alert">{detailError}</p> : null}
              {detail ? (
                <>
                  <dl className="git-history-context-meta">
                    <dt>Author</dt>
                    <dd>
                      {detail.authorName}
                      {detail.authorEmail ? (
                        <span className="git-history-context-email"> &lt;{detail.authorEmail}&gt;</span>
                      ) : null}
                    </dd>
                    <dt>Date</dt>
                    <dd>{formatDate(detail.authoredAt || focusCommit.authoredAt)}</dd>
                    {detail.filesChanged > 0 ? (
                      <>
                        <dt>Changes</dt>
                        <dd>
                          {detail.filesChanged} file{detail.filesChanged === 1 ? "" : "s"}
                          {detail.insertions || detail.deletions
                            ? ` (+${detail.insertions} / −${detail.deletions})`
                            : null}
                        </dd>
                      </>
                    ) : null}
                    {focusCommit.docsPath ? (
                      <>
                        <dt>Docs</dt>
                        <dd className="git-history-context-path">{focusCommit.docsPath}</dd>
                      </>
                    ) : null}
                  </dl>
                  {detail.body ? (
                    <pre className="git-history-context-body">{detail.body}</pre>
                  ) : (
                    <p className="doc-workspace-muted">No commit message body.</p>
                  )}
                </>
              ) : null}
            </section>
          </div>
        ) : null}

        {focusCommit && tab === "github" ? (
          <div key="github" className="insights-panel-enter">
            {localOnlyMode ? (
              <section className="insights-card">
                <p className="insights-prose">
                  GitHub linking is disabled in local-only mode. Sign in with GitHub to see PRs,
                  issues, and review threads for this commit.
                </p>
              </section>
            ) : !repository ? (
              <section className="insights-card">
                <p className="insights-prose">
                  This workspace has no GitHub repository slug. Link a remote on GitHub or create
                  the workspace from a GitHub repo.
                </p>
              </section>
            ) : (
              <>
                {ghLoading ? (
                  <p className="doc-workspace-muted">
                    <Loader2 size={16} className="spin-ic" aria-hidden /> Loading GitHub context…
                  </p>
                ) : null}
                {(() => {
                  const msg = friendlyGhError(ghError);
                  return msg ? <p className="insights-alert">{msg}</p> : null;
                })()}

                <section className="insights-card">
                  <h3 className="insights-card-title">Pull requests</h3>
                  {ghContext?.pullRequests.length ? (
                    <ul className="git-history-gh-list">
                      {ghContext.pullRequests.map((pr) => (
                        <li key={pr.number}>
                          <a
                            href={pr.url}
                            className="git-history-gh-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            #{pr.number} {pr.title}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                          <span className={`git-history-gh-state git-history-gh-state--${pr.state}`}>
                            {pr.state}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="doc-workspace-muted">No linked pull requests for this commit.</p>
                  )}
                </section>

                <section className="insights-card">
                  <h3 className="insights-card-title">Issues</h3>
                  {ghContext?.issues.length ? (
                    <ul className="git-history-gh-list">
                      {ghContext.issues.map((issue) => (
                        <li key={issue.number}>
                          <a
                            href={issue.url}
                            className="git-history-gh-link"
                            target="_blank"
                            rel="noreferrer"
                          >
                            #{issue.number} {issue.title}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                          <span
                            className={`git-history-gh-state git-history-gh-state--${issue.state}`}
                          >
                            {issue.state}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="doc-workspace-muted">No issues found for this commit.</p>
                  )}
                </section>

                <section className="insights-card">
                  <h3 className="insights-card-title">Discussion</h3>
                  {ghContext?.threads.length ? (
                    <ul className="github-thread-list">
                      {ghContext.threads.map((t, i) => (
                        <li key={`${t.kind}-${t.number}-${i}`} className="github-thread">
                          <div className="github-thread-meta">
                            <span className="github-thread-kind">{threadKindLabel(t.kind)}</span>
                            <span className="github-thread-ref">#{t.number}</span>
                            <span className="github-thread-author">@{t.author}</span>
                            {t.createdAt ? (
                              <time className="github-thread-time" dateTime={t.createdAt}>
                                {formatDate(t.createdAt)}
                              </time>
                            ) : null}
                          </div>
                          <p className="github-thread-body">{t.body.slice(0, 1200)}</p>
                          {t.url ? (
                            <a
                              href={t.url}
                              className="git-history-gh-link github-thread-link"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open on GitHub
                              <ExternalLink size={12} aria-hidden />
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="doc-workspace-muted">No review or issue comments yet.</p>
                  )}
                </section>
              </>
            )}
            {onOpenSettings && !localOnlyMode ? (
              <button type="button" className="doc-workspace-copy-btn" onClick={onOpenSettings}>
                LLM &amp; GitHub settings
              </button>
            ) : null}
          </div>
        ) : null}

        {focusCommit && tab === "actions" ? (
          <div key="actions" className="insights-panel-enter">
            <section className="insights-card">
              <h3 className="insights-card-title">Compare</h3>
              <p className="insights-prose">
                {base
                  ? `Base: ${base.shortHash}${head && !useLiveHead ? ` → Head: ${head.shortHash}` : useLiveHead ? " → live folder" : ""}`
                  : "Set a base commit in the strip above."}
              </p>
              <button
                type="button"
                className="git-history-action-btn git-history-action-btn--primary"
                disabled={!canCompare || busy}
                onClick={onCompare}
              >
                <GitCompareArrows size={16} aria-hidden />
                Run semantic compare
              </button>
              {onReviewInCity ? (
                <button
                  type="button"
                  className="git-history-action-btn"
                  disabled={busy}
                  onClick={onReviewInCity}
                >
                  Review in City
                </button>
              ) : null}
            </section>

            <section className="insights-card">
              <h3 className="insights-card-title">Revision markers</h3>
              <div className="git-history-action-grid">
                <button
                  type="button"
                  className="git-history-action-btn"
                  onClick={() => onSetBase(focusCommit.hash)}
                >
                  <GitBranch size={14} aria-hidden />
                  Set as base
                </button>
                <button
                  type="button"
                  className="git-history-action-btn"
                  disabled={useLiveHead}
                  onClick={() => onSetHead(focusCommit.hash)}
                >
                  <GitBranch size={14} aria-hidden />
                  Set as head
                </button>
              </div>
            </section>

            <section className="insights-card">
              <h3 className="insights-card-title">More</h3>
              <div className="git-history-action-grid">
                <button
                  type="button"
                  className="git-history-action-btn"
                  onClick={() => setBlameOpen(true)}
                >
                  Line blame
                </button>
                <button
                  type="button"
                  className="git-history-action-btn"
                  disabled={!parent}
                  title={parent ? "Document changes since parent" : "No parent commit"}
                  onClick={() => {
                    if (parent) {
                      void onDocument(parent, focusCommit);
                    }
                  }}
                >
                  <BookOpen size={14} aria-hidden />
                  Generate docs
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </aside>
    </>
  );
}
