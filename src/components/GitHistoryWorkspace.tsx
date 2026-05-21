import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import type {
  GitHistoryCompareOptions,
  NovaWorkspace,
  WorkspaceCommitSnapshot,
} from "../app/workspaceTypes";
import { GitHistoryContextPanel } from "./GitHistoryContextPanel";
import { HistoryCompareStrip } from "./HistoryCompareStrip";

export interface GitHistoryWorkspaceProps {
  workspace: NovaWorkspace;
  busy: boolean;
  error: string | null;
  localOnlyMode?: boolean;
  onOpenSettings?: () => void;
  onCompareCommits: (
    base: WorkspaceCommitSnapshot,
    head: WorkspaceCommitSnapshot | null,
    options?: GitHistoryCompareOptions,
  ) => void | Promise<void>;
  onDocumentCommit: (base: WorkspaceCommitSnapshot, head: WorkspaceCommitSnapshot) => void | Promise<void>;
  onLiveRepoPersist: (liveDevRepoRoot: string) => Promise<void>;
  onRefreshHistory?: () => void | Promise<void>;
  onReviewInCity?: () => void;
}

export function GitHistoryWorkspace({
  workspace,
  busy,
  error,
  localOnlyMode = false,
  onOpenSettings,
  onCompareCommits,
  onDocumentCommit,
  onLiveRepoPersist,
  onRefreshHistory,
  onReviewInCity,
}: GitHistoryWorkspaceProps) {
  const api = window.electronAPI;
  const commits = workspace.commits ?? [];
  const [baseHash, setBaseHash] = useState("");
  const [headHash, setHeadHash] = useState("");
  const [focusHash, setFocusHash] = useState("");
  const [useLiveHead, setUseLiveHead] = useState(false);
  const [liveRepoRoot, setLiveRepoRoot] = useState(
    workspace.liveDevRepoRoot ?? workspace.repoRoot ?? "",
  );
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
      const b = sorted[sorted.length - 2].hash;
      const h = sorted[sorted.length - 1].hash;
      setBaseHash(b);
      setHeadHash(h);
      setFocusHash(h);
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
  const focusCommit =
    sorted.find((c) => c.hash === focusHash) ?? head ?? base ?? null;

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

  const canCompare =
    Boolean(base) &&
    !indexing &&
    !busy &&
    (useLiveHead ? Boolean(liveRepoRoot.trim()) : Boolean(head && base && base.hash !== head.hash));

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

      <div className="git-history-main">
        <section className="git-history-commits-panel insights" aria-label="Indexed commits">
          {indexing ? (
            <p className="git-history-commits-alert doc-workspace-muted">
              <Loader2 size={16} className="spin-ic" aria-hidden />
              {workspace.historyProgress?.message ?? "Indexing commit history…"}
            </p>
          ) : null}
          {workspace.historyStatus === "error" ? (
            <p className="git-history-commits-alert doc-workspace-alert">{workspace.historyError}</p>
          ) : null}
          <header className="git-history-commits-toolbar">
            <h2 className="git-history-commits-toolbar-title">
              Indexed commits <span className="git-history-commits-count">({sorted.length})</span>
            </h2>
            <div className="git-history-commits-toolbar-actions">
              {onRefreshHistory ? (
                <button
                  type="button"
                  className="git-history-toolbar-btn"
                  disabled={indexing}
                  onClick={() => void onRefreshHistory()}
                >
                  <RefreshCw size={14} aria-hidden />
                  Sync from git
                </button>
              ) : null}
              <label className="git-history-commits-search">
                <Search size={14} aria-hidden />
                <input
                  type="search"
                  placeholder="Filter commits…"
                  value={commitQuery}
                  onChange={(e) => setCommitQuery(e.target.value)}
                />
              </label>
            </div>
          </header>
          <div className="git-history-commits-scroll insights-scroll">
            {sorted.length === 0 ? (
              <p className="doc-workspace-muted git-history-commits-empty">
                No snapshots yet — indexing runs when the workspace is created.
              </p>
            ) : (
              <ul className="git-history-commit-list">
                {filteredCommits.map((c) => {
                  const isBase = c.hash === baseHash;
                  const isHead = c.hash === headHash && !useLiveHead;
                  const isFocus = c.hash === focusCommit?.hash;
                  return (
                    <li key={c.hash}>
                      <button
                        type="button"
                        className={`git-history-commit-row${isBase ? " is-base" : ""}${isHead ? " is-head" : ""}${isFocus ? " is-focus" : ""}`}
                        onClick={() => setFocusHash(c.hash)}
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
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <GitHistoryContextPanel
          workspace={workspace}
          focusCommit={focusCommit}
          base={base}
          head={head}
          useLiveHead={useLiveHead}
          busy={busy}
          localOnlyMode={localOnlyMode}
          canCompare={canCompare}
          onSetBase={setBaseHash}
          onSetHead={(hash) => {
            setHeadHash(hash);
            setUseLiveHead(false);
          }}
          onCompare={runCompare}
          onDocument={onDocumentCommit}
          onOpenSettings={onOpenSettings}
          onReviewInCity={onReviewInCity}
        />
      </div>
    </main>
  );
}
