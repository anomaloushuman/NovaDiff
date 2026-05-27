import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import type { GitBranchSummary } from "../app/gitTypes";
import {
  commitFromBranchTip,
  enrichBranchCommits,
  pickDefaultBaseBranch,
  pickDefaultHeadBranch,
  resolveGitRepoRoot,
} from "../app/gitHistoryBranches";
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
  const indexedCommits = workspace.commits ?? [];
  const [baseHash, setBaseHash] = useState("");
  const [headHash, setHeadHash] = useState("");
  const [focusHash, setFocusHash] = useState("");
  const [useLiveHead, setUseLiveHead] = useState(false);
  const [liveRepoRoot, setLiveRepoRoot] = useState(
    workspace.liveDevRepoRoot ?? workspace.repoRoot ?? "",
  );
  const [commitQuery, setCommitQuery] = useState("");
  const [branches, setBranches] = useState<GitBranchSummary[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchLoadError, setBranchLoadError] = useState<string | null>(null);
  const [baseBranch, setBaseBranch] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [branchCommits, setBranchCommits] = useState<WorkspaceCommitSnapshot[]>([]);
  const [branchCommitsLoading, setBranchCommitsLoading] = useState(false);

  const gitRepoRoot = useMemo(
    () => resolveGitRepoRoot(workspace, liveRepoRoot),
    [workspace, liveRepoRoot],
  );

  useEffect(() => {
    setLiveRepoRoot(workspace.liveDevRepoRoot ?? workspace.repoRoot ?? "");
  }, [workspace.id, workspace.liveDevRepoRoot, workspace.repoRoot]);

  const loadBranches = useCallback(async () => {
    if (!gitRepoRoot || !api?.gitListBranches) {
      setBranches([]);
      setBranchLoadError(
        api?.gitListBranches
          ? "No git repository path on this workspace."
          : "Branch listing requires the NovaDiff desktop app.",
      );
      return;
    }
    setBranchesLoading(true);
    setBranchLoadError(null);
    try {
      const result = await api.gitListBranches({ repoRoot: gitRepoRoot });
      const list = result.branches ?? [];
      setBranches(list);
      if (list.length === 0) {
        setBranchLoadError("No branches found in this repository.");
        return;
      }
      setBaseBranch((prev) =>
        prev && list.some((b) => b.name === prev) ? prev : pickDefaultBaseBranch(list),
      );
      setHeadBranch((prev) =>
        prev && list.some((b) => b.name === prev)
          ? prev
          : pickDefaultHeadBranch(list, result.currentBranch),
      );
    } catch (e) {
      setBranches([]);
      setBranchLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setBranchesLoading(false);
    }
  }, [api, gitRepoRoot]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const reloadBranchCommits = useCallback(async () => {
    if (!gitRepoRoot || !api?.gitListBranchCommits || (!baseBranch && !headBranch)) {
      setBranchCommits([]);
      return;
    }
    setBranchCommitsLoading(true);
    try {
      const [baseRaw, headRaw] = await Promise.all([
        baseBranch ? api.gitListBranchCommits({ repoRoot: gitRepoRoot, branch: baseBranch }) : [],
        headBranch && !useLiveHead
          ? api.gitListBranchCommits({ repoRoot: gitRepoRoot, branch: headBranch })
          : [],
      ]);
      const merged = enrichBranchCommits(
        [...baseRaw, ...headRaw],
        indexedCommits,
      );
      const byHash = new Map<string, WorkspaceCommitSnapshot>();
      for (const c of merged) {
        byHash.set(c.hash, c);
      }
      setBranchCommits([...byHash.values()].sort((a, b) => a.authoredAt.localeCompare(b.authoredAt)));

      const baseTip = baseRaw.length > 0 ? baseRaw[baseRaw.length - 1].hash : "";
      const headTip = headRaw.length > 0 ? headRaw[headRaw.length - 1].hash : "";
      if (baseTip) {
        setBaseHash((prev) => (prev && byHash.has(prev) ? prev : baseTip));
      }
      if (headTip && !useLiveHead) {
        setHeadHash((prev) => (prev && byHash.has(prev) ? prev : headTip));
        setFocusHash((prev) => (prev && byHash.has(prev) ? prev : headTip));
      }
    } catch {
      setBranchCommits([]);
    } finally {
      setBranchCommitsLoading(false);
    }
  }, [api, baseBranch, headBranch, gitRepoRoot, indexedCommits, useLiveHead]);

  useEffect(() => {
    void reloadBranchCommits();
  }, [reloadBranchCommits]);

  const listCommits = useMemo(() => {
    const byHash = new Map<string, WorkspaceCommitSnapshot>();
    for (const c of [...branchCommits, ...indexedCommits]) {
      byHash.set(c.hash, c);
    }
    return [...byHash.values()].sort((a, b) => a.authoredAt.localeCompare(b.authoredAt));
  }, [branchCommits, indexedCommits]);

  const filteredCommits = useMemo(() => {
    const q = commitQuery.trim().toLowerCase();
    const source = [...listCommits].reverse();
    if (!q) {
      return source;
    }
    return source.filter(
      (c) =>
        c.shortHash.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q),
    );
  }, [listCommits, commitQuery]);

  const baseBranchMeta = branches.find((b) => b.name === baseBranch) ?? null;
  const headBranchMeta = branches.find((b) => b.name === headBranch) ?? null;

  const base =
    listCommits.find((c) => c.hash === baseHash) ??
    (baseBranchMeta ? commitFromBranchTip(baseBranchMeta) : null);
  const head =
    listCommits.find((c) => c.hash === headHash) ??
    (headBranchMeta && !useLiveHead ? commitFromBranchTip(headBranchMeta) : null);
  const focusCommit =
    listCommits.find((c) => c.hash === focusHash) ?? head ?? base ?? null;

  const historyIndexing =
    workspace.historyStatus === "indexing" ||
    (workspace.historyStatus === "idle" && indexedCommits.length === 0);

  const browseLiveRepo = () => {
    void (async () => {
      const p = await api?.pickDirectory?.();
      if (p) {
        setLiveRepoRoot(p);
        await onLiveRepoPersist(p);
        void loadBranches();
      }
    })();
  };

  const persistLiveRepo = useCallback(async () => {
    const root = liveRepoRoot.trim();
    if (root) {
      await onLiveRepoPersist(root);
      void loadBranches();
    }
  }, [liveRepoRoot, onLiveRepoPersist, loadBranches]);

  const swapBranches = () => {
    setBaseBranch(headBranch);
    setHeadBranch(baseBranch);
    setBaseHash(headHash);
    setHeadHash(baseHash);
  };

  const runCompare = () => {
    const baseCommit =
      listCommits.find((c) => c.hash === baseHash) ??
      (baseBranchMeta ? commitFromBranchTip(baseBranchMeta) : null);
    if (!baseCommit) {
      return;
    }
    if (useLiveHead) {
      const root = liveRepoRoot.trim();
      if (!root) {
        return;
      }
      void onCompareCommits(baseCommit, null, { useLiveHead: true, liveRepoRoot: root });
      return;
    }
    const headCommit =
      listCommits.find((c) => c.hash === headHash) ??
      (headBranchMeta ? commitFromBranchTip(headBranchMeta) : null);
    if (headCommit && baseCommit.hash !== headCommit.hash) {
      void onCompareCommits(baseCommit, headCommit);
    }
  };

  const canCompare =
    Boolean(baseBranchMeta) &&
    !historyIndexing &&
    !busy &&
    !branchesLoading &&
    (useLiveHead
      ? Boolean(liveRepoRoot.trim())
      : Boolean(
          headBranchMeta &&
            baseBranchMeta &&
            baseBranchMeta.hash !== headBranchMeta.hash,
        ));

  return (
    <main className="workspace git-history-workspace">
      <HistoryCompareStrip
        branches={branches}
        branchesLoading={branchesLoading}
        branchLoadError={branchLoadError}
        baseBranch={baseBranch}
        headBranch={headBranch}
        useLiveHead={useLiveHead}
        liveRepoRoot={liveRepoRoot}
        busy={busy}
        error={error}
        loading={historyIndexing || branchCommitsLoading}
        onBaseBranch={setBaseBranch}
        onHeadBranch={setHeadBranch}
        onUseLiveHead={setUseLiveHead}
        onBrowseLiveRepo={browseLiveRepo}
        onLiveRepoBlur={() => void persistLiveRepo()}
        onSwap={swapBranches}
        onCompare={runCompare}
      />

      <div className="git-history-main">
        <section className="git-history-commits-panel insights" aria-label="Commits on selected branches">
          {historyIndexing ? (
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
              Commits on selected branches{" "}
              <span className="git-history-commits-count">
                ({listCommits.length}
                {baseBranch || headBranch
                  ? ` · ${baseBranch || "—"} → ${useLiveHead ? "live folder" : headBranch || "—"}`
                  : ""}
                )
              </span>
            </h2>
            <div className="git-history-commits-toolbar-actions">
              <button
                type="button"
                className="git-history-toolbar-btn"
                disabled={branchesLoading}
                onClick={() => void loadBranches()}
              >
                <RefreshCw size={14} aria-hidden />
                Reload branches
              </button>
              {onRefreshHistory ? (
                <button
                  type="button"
                  className="git-history-toolbar-btn"
                  disabled={historyIndexing}
                  onClick={() => void onRefreshHistory()}
                >
                  Sync snapshots
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
            {branchCommitsLoading ? (
              <p className="doc-workspace-muted git-history-commits-empty">
                <Loader2 size={16} className="spin-ic" aria-hidden /> Loading commits…
              </p>
            ) : listCommits.length === 0 ? (
              <p className="doc-workspace-muted git-history-commits-empty">
                Select base and target branches above to list their commits.
              </p>
            ) : (
              <ul className="git-history-commit-list">
                {filteredCommits.map((c) => {
                  const isBase = c.hash === baseHash;
                  const isHead = c.hash === headHash && !useLiveHead;
                  const isFocus = c.hash === focusHash;
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
                            <span className="git-history-badge git-history-badge--head">Target</span>
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
