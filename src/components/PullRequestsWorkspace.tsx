import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  FolderGit2,
  GitPullRequest,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import type {
  GithubPullRequestSummary,
  GithubRepoSummary,
  GitToolingStatus,
  LocalRepoMatch,
} from "../app/gitTypes";

export interface PullRequestsWorkspaceProps {
  suggestedRepoPath: string;
  onOpenCompare: (payload: {
    leftRoot: string;
    rightRoot: string;
    leftTitle: string;
    rightTitle: string;
  }) => void;
  onUseRepoAsTarget: (repoPath: string) => void;
}

export function PullRequestsWorkspace({
  suggestedRepoPath,
  onOpenCompare,
  onUseRepoAsTarget,
}: PullRequestsWorkspaceProps) {
  const [tooling, setTooling] = useState<GitToolingStatus | null>(null);
  const [repos, setRepos] = useState<GithubRepoSummary[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepoSummary | null>(null);
  const [localMatches, setLocalMatches] = useState<LocalRepoMatch[]>([]);
  const [prs, setPrs] = useState<GithubPullRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [prsLoading, setPrsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState("");
  const [busyPr, setBusyPr] = useState<number | null>(null);

  const api = window.electronAPI;

  const refreshTooling = useCallback(async () => {
    if (!api?.gitDetectTooling) {
      setError("Git integration requires the NovaDiff desktop app.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const t = await api.gitDetectTooling();
      setTooling(t);
      if (t.gh.loggedIn && api.githubListRepos) {
        const list = await api.githubListRepos({ limit: 60 });
        setRepos(list);
      } else {
        setRepos([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void refreshTooling();
  }, [refreshTooling]);

  const resolveLocal = useCallback(
    async (repo: GithubRepoSummary) => {
      if (!api?.gitMatchLocalRepo) {
        return [];
      }
      const extra = suggestedRepoPath.trim() ? [suggestedRepoPath.trim()] : [];
      return api.gitMatchLocalRepo({
        owner: repo.owner,
        repo: repo.name,
        extraRoots: extra,
      });
    },
    [api, suggestedRepoPath],
  );

  const selectRepo = useCallback(
    async (repo: GithubRepoSummary) => {
      setSelectedRepo(repo);
      setPrs([]);
      setError(null);
      setPrsLoading(true);
      try {
        const matches = await resolveLocal(repo);
        setLocalMatches(matches);
        if (api?.githubListPrs) {
          const list = await api.githubListPrs({
            repository: repo.fullName,
            state: "open",
            limit: 50,
          });
          setPrs(list);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setPrsLoading(false);
      }
    },
    [api, resolveLocal],
  );

  const openPrCompare = useCallback(
    async (pr: GithubPullRequestSummary) => {
      const local = localMatches[0]?.path;
      if (!local || !api?.githubPrCompareRoots) {
        setError("Clone this repository locally, then select it to compare the PR.");
        return;
      }
      setBusyPr(pr.number);
      setError(null);
      try {
        const roots = await api.githubPrCompareRoots({
          repoRoot: local,
          baseRef: pr.baseRef,
          headRef: pr.headRef,
        });
        onOpenCompare({
          leftRoot: roots.leftRoot,
          rightRoot: roots.rightRoot,
          leftTitle: `${pr.baseRef}`,
          rightTitle: `${pr.headRef}`,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusyPr(null);
      }
    },
    [api, localMatches, onOpenCompare],
  );

  const filteredRepos = repos.filter((r) => {
    const q = repoFilter.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return r.fullName.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
  });

  return (
    <main className="git-workspace">
      <header className="git-workspace-header">
        <div>
          <h1 className="git-workspace-title">
            <GitPullRequest size={22} strokeWidth={1.75} aria-hidden />
            Pull requests
          </h1>
          <p className="git-workspace-lead">
            Uses GitHub CLI (<code>gh</code>) when you are signed in. Local clones are
            discovered under common project folders on macOS, Windows, and Linux.
          </p>
        </div>
        <button
          type="button"
          className="doc-workspace-btn"
          disabled={loading}
          onClick={() => void refreshTooling()}
        >
          {loading ? (
            <Loader2 size={16} className="spin-ic" aria-hidden />
          ) : (
            <RefreshCw size={16} aria-hidden />
          )}
          Refresh
        </button>
      </header>

      {loading ? (
        <p className="doc-workspace-muted">Detecting git and GitHub CLI…</p>
      ) : null}

      {tooling ? (
        <div className="git-status-cards">
          <div className="git-status-card">
            <span className="git-status-label">Git</span>
            <strong>
              {tooling.git.gitAvailable ? tooling.git.gitVersion ?? "OK" : "Not found"}
            </strong>
          </div>
          <div className={`git-status-card${tooling.gh.loggedIn ? " is-ok" : ""}`}>
            <span className="git-status-label">GitHub</span>
            <strong>{tooling.gh.message}</strong>
          </div>
        </div>
      ) : null}

      {error ? <p className="doc-workspace-alert">{error}</p> : null}

      {!tooling?.gh.loggedIn && !loading ? (
        <section className="doc-workspace-panel">
          <p className="doc-workspace-prose">
            Sign in with the GitHub CLI to list repositories and pull requests:
          </p>
          <pre className="git-cli-hint">gh auth login</pre>
          <p className="doc-workspace-muted">
            After login, click Refresh. NovaDiff never stores your GitHub token;{" "}
            <code>gh</code> manages credentials on your machine.
          </p>
        </section>
      ) : null}

      {tooling?.gh.loggedIn ? (
        <div className="git-workspace-split">
          <section className="doc-workspace-panel git-repo-list-panel">
            <h2 className="doc-workspace-h2">Your repositories</h2>
            <div className="git-search-row">
              <Search size={16} aria-hidden />
              <input
                type="search"
                className="doc-workspace-search"
                placeholder="Filter repositories…"
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
              />
            </div>
            <ul className="git-repo-list">
              {filteredRepos.map((repo) => (
                <li key={repo.fullName}>
                  <button
                    type="button"
                    className={`git-repo-item${selectedRepo?.fullName === repo.fullName ? " active" : ""}`}
                    onClick={() => void selectRepo(repo)}
                  >
                    <span className="git-repo-item-name">{repo.fullName}</span>
                    <span className="git-repo-item-meta">{repo.defaultBranch}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="doc-workspace-panel git-pr-panel">
            {!selectedRepo ? (
              <p className="doc-workspace-muted">Select a repository to list open PRs.</p>
            ) : (
              <>
                <h2 className="doc-workspace-h2">{selectedRepo.fullName}</h2>
                <div className="git-local-match-block">
                  <h3 className="doc-workspace-h3">Local clone</h3>
                  {localMatches.length === 0 ? (
                    <p className="doc-workspace-muted">
                      No local folder matched this remote. Clone the repo, then Refresh.
                    </p>
                  ) : (
                    localMatches.map((m) => (
                      <div key={m.path} className="git-local-match-row">
                        <code className="git-path-chip">{m.path}</code>
                        <button
                          type="button"
                          className="doc-workspace-copy-btn"
                          onClick={() => onUseRepoAsTarget(m.path)}
                        >
                          <FolderGit2 size={14} aria-hidden />
                          Use as target
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <h3 className="doc-workspace-h3">Open pull requests</h3>
                {prsLoading ? (
                  <p className="doc-workspace-muted">Loading pull requests…</p>
                ) : prs.length === 0 ? (
                  <p className="doc-workspace-muted">No open pull requests.</p>
                ) : (
                  <ul className="git-pr-list">
                    {prs.map((pr) => (
                      <li key={pr.number} className="git-pr-card">
                        <div className="git-pr-card-head">
                          <span className="git-pr-number">#{pr.number}</span>
                          {pr.isDraft ? <span className="git-pr-draft">Draft</span> : null}
                          <a
                            href={pr.url}
                            className="git-pr-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={14} aria-hidden />
                          </a>
                        </div>
                        <p className="git-pr-title">{pr.title}</p>
                        <p className="git-pr-meta">
                          {pr.headRef} → {pr.baseRef} · @{pr.author}
                        </p>
                        <div className="git-pr-actions">
                          <button
                            type="button"
                            className="doc-workspace-btn"
                            disabled={!localMatches.length || busyPr === pr.number}
                            onClick={() => void openPrCompare(pr)}
                          >
                            {busyPr === pr.number ? (
                              <Loader2 size={14} className="spin-ic" aria-hidden />
                            ) : null}
                            Compare in NovaDiff
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
