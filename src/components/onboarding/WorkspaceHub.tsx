import { useCallback, useEffect, useState } from "react";
import { FolderGit2, Loader2, Plus } from "lucide-react";
import type { GitUserProfile, NovaWorkspace, WorkspaceSessionState } from "../../app/workspaceTypes";
import type { GithubRepoSummary } from "../../app/gitTypes";

export interface WorkspaceHubProps {
  gitUser: GitUserProfile;
  workspaces: NovaWorkspace[];
  onOpenWorkspace: (workspace: NovaWorkspace, session?: WorkspaceSessionState) => void;
  onSessionChange: (workspaces: NovaWorkspace[]) => void;
}

type RepoMode = "local" | "clone" | "github";

export function WorkspaceHub({
  gitUser,
  workspaces,
  onOpenWorkspace,
  onSessionChange,
}: WorkspaceHubProps) {
  const api = window.electronAPI;
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<RepoMode>("local");
  const [repoRoot, setRepoRoot] = useState("");
  const [cloneUrl, setCloneUrl] = useState("");
  const [ghRepos, setGhRepos] = useState<GithubRepoSummary[]>([]);
  const [selectedGh, setSelectedGh] = useState("");
  const [historyMsg, setHistoryMsg] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    if (!api?.workspaceList) {
      return;
    }
    const list = await api.workspaceList();
    onSessionChange(list);
  }, [api, onSessionChange]);

  useEffect(() => {
    if (!api?.onWorkspaceHistoryProgress) {
      return;
    }
    return api.onWorkspaceHistoryProgress((msg) => {
      const m = msg as { message?: string; done?: boolean };
      if (m.message) {
        setHistoryMsg(m.message);
      }
      if (m.done) {
        void refreshList();
      }
    });
  }, [api, refreshList]);

  useEffect(() => {
    if (mode !== "github" || !api?.githubListRepos) {
      return;
    }
    void api.githubListRepos({ limit: 50 }).then(setGhRepos).catch(() => setGhRepos([]));
  }, [mode, api]);

  const browseLocal = async () => {
    const p = await api?.pickDirectory?.();
    if (p) {
      setRepoRoot(p);
    }
  };

  const resolveGithubClone = async (slug: string) => {
    const [owner, repo] = slug.split("/");
    if (!owner || !repo) {
      return null;
    }
    const matches = await api?.workspaceMatchLocal?.({ owner, repo });
    if (matches?.[0]?.path) {
      return matches[0].path;
    }
    return `https://github.com/${slug}.git`;
  };

  const createWorkspace = async () => {
    if (!api?.workspaceCreate) {
      setError("Workspace creation requires the NovaDiff desktop app.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      let payload: {
        name: string;
        repoRoot?: string;
        cloneUrl?: string;
        githubSlug?: string;
      } = { name: name.trim() || "My workspace" };

      if (mode === "local") {
        if (!repoRoot.trim()) {
          throw new Error("Choose a folder that contains your git repository.");
        }
        payload = { ...payload, repoRoot: repoRoot.trim() };
      } else if (mode === "clone") {
        if (!cloneUrl.trim()) {
          throw new Error("Enter a git clone URL.");
        }
        payload = { ...payload, cloneUrl: cloneUrl.trim() };
      } else {
        if (!selectedGh) {
          throw new Error("Select a GitHub repository.");
        }
        const local = await resolveGithubClone(selectedGh);
        if (local && !local.startsWith("http")) {
          payload = { ...payload, repoRoot: local, githubSlug: selectedGh };
        } else {
          payload = {
            ...payload,
            cloneUrl: local ?? `https://github.com/${selectedGh}.git`,
            githubSlug: selectedGh,
          };
        }
      }

      const result = await api.workspaceCreate(payload);
      const ws =
        result && typeof result === "object" && "workspace" in result
          ? result.workspace
          : (result as NovaWorkspace);
      const serverSession =
        result && typeof result === "object" && "session" in result
          ? result.session
          : undefined;
      if (serverSession) {
        onSessionChange(serverSession.workspaces);
      } else {
        await refreshList();
      }
      onOpenWorkspace(ws as NovaWorkspace, serverSession);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const openExisting = async (ws: NovaWorkspace) => {
    let serverSession: WorkspaceSessionState | undefined;
    if (api?.workspaceSetActive) {
      serverSession = await api.workspaceSetActive({ workspaceId: ws.id });
    }
    onOpenWorkspace(ws, serverSession);
  };

  return (
    <div className="workspace-hub ui-view-enter">
      <div className="workspace-hub-frame">
        <header className="workspace-hub-header">
          <div className="workspace-hub-user">
            {gitUser.avatarUrl ? (
              <img src={gitUser.avatarUrl} alt="" width={40} height={40} className="welcome-user-avatar" />
            ) : null}
            <div>
              <h1 className="welcome-screen-title">Workspaces</h1>
              <p className="welcome-screen-lead">
                Signed in as <strong>@{gitUser.login}</strong>. Open an existing workspace or tie a new
                one to a repository — NovaDiff will index every commit for semantic history compare.
              </p>
            </div>
          </div>
        </header>

        {historyMsg ? <p className="doc-workspace-muted">{historyMsg}</p> : null}
        {error ? <p className="doc-workspace-alert">{error}</p> : null}

        <section className="doc-workspace-panel">
          <h2 className="doc-workspace-h2">Your workspaces</h2>
          {workspaces.length === 0 ? (
            <p className="doc-workspace-muted">No workspaces yet — create one below.</p>
          ) : (
            <ul className="workspace-hub-list">
              {workspaces.map((ws) => (
                <li key={ws.id}>
                  <button
                    type="button"
                    className="welcome-user-card workspace-hub-card"
                    onClick={() => void openExisting(ws)}
                  >
                    <span className="sidebar-repo-icon" aria-hidden>
                      <FolderGit2 size={22} />
                    </span>
                    <span className="welcome-user-text">
                      <strong>{ws.name}</strong>
                      <span>
                        {ws.githubSlug ?? ws.repoRoot} · {ws.historyStatus}
                        {ws.historyProgress
                          ? ` (${ws.historyProgress.current}/${ws.historyProgress.total})`
                          : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="doc-workspace-panel">
          <h2 className="doc-workspace-h2">
            <Plus size={18} aria-hidden /> Create workspace
          </h2>
          <label className="doc-workspace-commit-field">
            <span className="doc-workspace-commit-label">Name</span>
            <input
              className="doc-workspace-search"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NovaDiff core"
            />
          </label>

          <div className="workspace-hub-tabs" role="tablist">
            {(["local", "clone", "github"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={`doc-workspace-preview-tab${mode === m ? " active" : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "local" ? "Local folder" : m === "clone" ? "Clone URL" : "GitHub repo"}
              </button>
            ))}
          </div>

          {mode === "local" ? (
            <div className="workspace-hub-repo-row">
              <input
                className="doc-workspace-search"
                value={repoRoot}
                onChange={(e) => setRepoRoot(e.target.value)}
                placeholder="/path/to/your/repo"
              />
              <button type="button" className="doc-workspace-copy-btn" onClick={() => void browseLocal()}>
                Browse…
              </button>
            </div>
          ) : null}

          {mode === "clone" ? (
            <input
              className="doc-workspace-search"
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
              placeholder="https://github.com/org/repo.git"
            />
          ) : null}

          {mode === "github" ? (
            <select
              className="doc-workspace-select"
              value={selectedGh}
              onChange={(e) => setSelectedGh(e.target.value)}
            >
              <option value="">Select repository…</option>
              {ghRepos.map((r) => (
                <option key={r.fullName} value={r.fullName}>
                  {r.fullName}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            className="doc-workspace-btn welcome-continue-btn"
            disabled={creating}
            onClick={() => void createWorkspace()}
          >
            {creating ? <Loader2 size={16} className="spin-ic" aria-hidden /> : null}
            Create &amp; index history
          </button>
        </section>
      </div>
    </div>
  );
}
