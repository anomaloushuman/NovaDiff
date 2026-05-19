import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, RefreshCw, Search } from "lucide-react";
import type {
  GitHistoryCompareOptions,
  NovaWorkspace,
  WorkspaceCommitSnapshot,
} from "../app/workspaceTypes";
import { GitBlamePanel } from "./GitBlamePanel";
import { HistoryCompareStrip } from "./HistoryCompareStrip";

export interface GitHistoryWorkspaceProps {
  workspace: NovaWorkspace;
  busy: boolean;
  error: string | null;
  onCompareCommits: (
    base: WorkspaceCommitSnapshot,
    head: WorkspaceCommitSnapshot | null,
    options?: GitHistoryCompareOptions,
  ) => void | Promise<void>;
  onDocumentCommit: (base: WorkspaceCommitSnapshot, head: WorkspaceCommitSnapshot) => void | Promise<void>;
  onLiveRepoPersist: (liveDevRepoRoot: string) => Promise<void>;
  onRefreshHistory?: () => void | Promise<void>;
}

export function GitHistoryWorkspace({
  workspace,
  busy,
  error,
  onCompareCommits,
  onDocumentCommit,
  onLiveRepoPersist,
  onRefreshHistory,
}: GitHistoryWorkspaceProps) {
  const api = window.electronAPI;
  const commits = workspace.commits ?? [];
  const [baseHash, setBaseHash] = useState("");
  const [headHash, setHeadHash] = useState("");
  const [useLiveHead, setUseLiveHead] = useState(false);
  const [liveRepoRoot, setLiveRepoRoot] = useState(
    workspace.liveDevRepoRoot ?? workspace.repoRoot ?? "",
  );
  const [blameCommit, setBlameCommit] = useState<WorkspaceCommitSnapshot | null>(null);
  const [commitQuery, setCommitQuery] = useState("");

  useEffect(() => {
    setLiveRepoRoot(workspace.liveDevRepoRoot ?? workspace.repoRoot ?? "");
  }, [workspace.id, workspace.liveDevRepoRoot, workspace.repoRoot]);

  const sorted = useMemo(
    () => [...commits].sort((a, b) => a.authoredAt.localeCompare(b.authoredAt)),
    [commits],
  );

  useEffect(() => {
    if (sorted.length >= 2 && !baseHash && !headHash) {
      setBaseHash(sorted[sorted.length - 2].hash);
      setHeadHash(sorted[sorted.length - 1].hash);
    }
  }, [sorted, baseHash, headHash]);

  const filteredCommits = useMemo(() => {
    const q = commitQuery.trim().toLowerCase();
    if (!q) {
      return [...sorted].reverse();
    }
    return sorted
      .filter(
        (c) =>
          c.shortHash.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q),
      )
      .reverse();
  }, [sorted, commitQuery]);

  const base = sorted.find((c) => c.hash === baseHash) ?? null;
  const head = sorted.find((c) => c.hash === headHash) ?? null;

  const indexing =
    workspace.historyStatus === "indexing" ||
    (workspace.historyStatus === "idle" && commits.length === 0);

  const browseLiveRepo = () => {
    void (async () => {
      const p = await api?.pickDirectory?.();
      if (p) {
        setLiveRepoRoot(p);
        await onLiveRepoPersist(p);
      }
    })();
  };

  const persistLiveRepo = useCallback(async () => {
    const root = liveRepoRoot.trim();
    if (root) {
      await onLiveRepoPersist(root);
    }
  }, [liveRepoRoot, onLiveRepoPersist]);

  const parentOf = (commit: WorkspaceCommitSnapshot) => {
    const idx = sorted.findIndex((c) => c.hash === commit.hash);
    return idx > 0 ? sorted[idx - 1] : null;
  };

  const swapRevisions = () => {
    const b = baseHash;
    setBaseHash(headHash);
    setHeadHash(b);
  };

  const runCompare = () => {
    if (!base) {
      return;
    }
    if (useLiveHead) {
      const root = liveRepoRoot.trim();
      if (!root) {
        return;
      }
      void onCompareCommits(base, null, { useLiveHead: true, liveRepoRoot: root });
      return;
    }
    if (head && base.hash !== head.hash) {
      void onCompareCommits(base, head);
    }
  };

  return (
    <main className="workspace git-history-workspace">
      <HistoryCompareStrip
        commits={sorted}
        baseHash={baseHash}
        headHash={headHash}
        useLiveHead={useLiveHead}
        liveRepoRoot={liveRepoRoot}
        busy={busy}
        error={error}
        indexing={indexing}
        onBaseHash={setBaseHash}
        onHeadHash={setHeadHash}
        onUseLiveHead={setUseLiveHead}
        onLiveRepoRoot={setLiveRepoRoot}
        onBrowseLiveRepo={browseLiveRepo}
        onLiveRepoBlur={() => void persistLiveRepo()}
        onSwap={swapRevisions}
        onCompare={runCompare}
      />

      {indexing ? (
        <p className="git-history-status doc-workspace-muted">
          <Loader2 size={16} className="spin-ic" aria-hidden />
          {workspace.historyProgress?.message ?? "Indexing commit history…"}
        </p>
      ) : null}

      {workspace.historyStatus === "error" ? (
        <p className="doc-workspace-alert git-history-status">{workspace.historyError}</p>
      ) : null}

      <div className="git-history-body">
        {blameCommit ? (
          <GitBlamePanel
            repoRoot={workspace.repoRoot}
            commit={blameCommit}
            onClose={() => setBlameCommit(null)}
          />
        ) : null}

        <section className="git-history-commits-panel">
          <div className="git-history-commits-head">
            <h2 className="git-history-section-title">Indexed commits ({sorted.length})</h2>
            {onRefreshHistory ? (
              <button
                type="button"
                className="doc-workspace-copy-btn"
                disabled={indexing}
                onClick={() => void onRefreshHistory()}
              >
                <RefreshCw size={14} aria-hidden />
                Sync from git
              </button>
            ) : null}
            <label className="doc-workspace-search git-blame-search">
              <Search size={14} aria-hidden />
              <input
                type="search"
                placeholder="Filter commits…"
                value={commitQuery}
                onChange={(e) => setCommitQuery(e.target.value)}
              />
            </label>
          </div>
          {sorted.length === 0 ? (
            <p className="doc-workspace-muted">No snapshots yet — indexing runs when the workspace is created.</p>
          ) : (
            <ul className="git-history-commit-list">
              {filteredCommits.map((c) => {
                const parent = parentOf(c);
                const isBase = c.hash === baseHash;
                const isHead = c.hash === headHash;
                return (
                  <li
                    key={c.hash}
                    className={`git-history-commit-row${isBase || isHead ? " is-selected" : ""}`}
                  >
                    <code className="git-history-hash">{c.shortHash}</code>
                    <span className="git-history-commit-subject" title={c.subject}>
                      {c.subject}
                    </span>
                    <div className="git-history-commit-meta">
                      {isBase ? <span className="git-history-badge">Base</span> : null}
                      {isHead && !useLiveHead ? (
                        <span className="git-history-badge git-history-badge--head">Head</span>
                      ) : null}
                      <time dateTime={c.authoredAt}>{c.authoredAt.slice(0, 10)}</time>
                    </div>
                    <div className="git-history-commit-actions">
                      <button
                        type="button"
                        className="git-history-row-btn"
                        onClick={() => {
                          setBaseHash(c.hash);
                        }}
                      >
                        Set base
                      </button>
                      <button
                        type="button"
                        className="git-history-row-btn"
                        disabled={useLiveHead}
                        onClick={() => {
                          setHeadHash(c.hash);
                          setUseLiveHead(false);
                        }}
                      >
                        Set head
                      </button>
                      <button
                        type="button"
                        className="git-history-row-btn"
                        onClick={() => setBlameCommit(c)}
                      >
                        Blame
                      </button>
                      <button
                        type="button"
                        className="git-history-row-btn"
                        disabled={!parent}
                        title={parent ? "Document changes since parent" : "No parent commit"}
                        onClick={() => {
                          if (parent) {
                            void onDocumentCommit(parent, c);
                          }
                        }}
                      >
                        <BookOpen size={14} aria-hidden />
                        Docs
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

    </main>
  );
}
