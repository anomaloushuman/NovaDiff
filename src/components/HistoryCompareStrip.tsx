import {
  ArrowLeftRight,
  ChevronDown,
  GitBranch,
  GitCompareArrows,
  Loader2,
} from "lucide-react";
import type { WorkspaceCommitSnapshot } from "../app/workspaceTypes";

export interface HistoryCompareStripProps {
  commits: WorkspaceCommitSnapshot[];
  baseHash: string;
  headHash: string;
  useLiveHead: boolean;
  liveRepoRoot: string;
  busy: boolean;
  error: string | null;
  indexing: boolean;
  onBaseHash: (hash: string) => void;
  onHeadHash: (hash: string) => void;
  onUseLiveHead: (live: boolean) => void;
  onLiveRepoRoot: (path: string) => void;
  onBrowseLiveRepo: () => void;
  onLiveRepoBlur?: () => void;
  onSwap: () => void;
  onCompare: () => void;
}

function truncateSubject(subject: string, max = 48): string {
  const s = subject.trim();
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max - 1)}…`;
}

function commitLabel(c: WorkspaceCommitSnapshot): string {
  return `${c.shortHash} · ${truncateSubject(c.subject)}`;
}

export function HistoryCompareStrip({
  commits,
  baseHash,
  headHash,
  useLiveHead,
  liveRepoRoot,
  busy,
  error,
  indexing,
  onBaseHash,
  onHeadHash,
  onUseLiveHead,
  onLiveRepoRoot,
  onBrowseLiveRepo,
  onLiveRepoBlur,
  onSwap,
  onCompare,
}: HistoryCompareStripProps) {
  const base = commits.find((c) => c.hash === baseHash) ?? null;
  const head = commits.find((c) => c.hash === headHash) ?? null;
  const canCompare =
    Boolean(base) &&
    !indexing &&
    !busy &&
    (useLiveHead ? Boolean(liveRepoRoot.trim()) : Boolean(head && base && base.hash !== head.hash));

  return (
    <header className="git-history-header">
      <div className="git-history-header-copy">
        <h1 className="git-history-title">Git history compare</h1>
        <p className="git-history-lead">
          Compare indexed commits semantically, or diff a commit against your live working tree.
        </p>
      </div>

      <div className="workspace-setup-strip git-history-setup-strip">
        <div className="workspace-setup git-history-setup">
          <div className="path-selectors-group">
            <div className="path-selectors-labels" aria-hidden>
              <span className="path-field-label">
                Base <span className="path-field-hint">commit</span>
              </span>
              <span className="path-field-label path-swap-label-filler" aria-hidden="true">
                &nbsp;
              </span>
              <span className="path-field-label">
                Head <span className="path-field-hint">{useLiveHead ? "folder" : "commit"}</span>
              </span>
            </div>

            <div className="path-selectors-combined">
              <div className="path-selector-segment path-selector-segment--select">
                <span className="path-selector-lead-icon" aria-hidden>
                  <GitBranch size={17} strokeWidth={2} />
                </span>
                <select
                  id="git-history-base"
                  className="path-selector-input path-selector-select"
                  aria-label="Base commit"
                  value={baseHash}
                  onChange={(e) => onBaseHash(e.target.value)}
                  disabled={indexing || commits.length === 0}
                >
                  <option value="">Choose base…</option>
                  {commits.map((c) => (
                    <option key={c.hash} value={c.hash}>
                      {commitLabel(c)}
                    </option>
                  ))}
                </select>
                <span className="path-selector-chevron path-selector-chevron--static" aria-hidden>
                  <ChevronDown size={18} strokeWidth={2} />
                </span>
              </div>

              <button
                type="button"
                className="path-swap-btn path-swap-btn-joined"
                onClick={onSwap}
                disabled={busy || indexing}
                title="Swap base and head"
                aria-label="Swap base and head"
              >
                <ArrowLeftRight size={18} strokeWidth={2} aria-hidden />
              </button>

              <div
                className={`path-selector-segment${useLiveHead ? "" : " path-selector-segment--select"}`}
              >
                <span className="path-selector-lead-icon" aria-hidden>
                  <GitBranch size={17} strokeWidth={2} />
                </span>
                {useLiveHead ? (
                  <>
                    <input
                      id="git-history-live"
                      className="path-selector-input"
                      aria-label="Live dev repository"
                      value={liveRepoRoot}
                      onChange={(e) => onLiveRepoRoot(e.target.value)}
                      onBlur={() => onLiveRepoBlur?.()}
                      placeholder="Path to local git clone…"
                      spellCheck={false}
                      title={liveRepoRoot.trim() || undefined}
                    />
                    <button
                      type="button"
                      className="path-selector-chevron"
                      onClick={onBrowseLiveRepo}
                      aria-label="Browse for live repository"
                    >
                      <ChevronDown size={18} strokeWidth={2} aria-hidden />
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      id="git-history-head"
                      className="path-selector-input path-selector-select"
                      aria-label="Head commit"
                      value={headHash}
                      onChange={(e) => onHeadHash(e.target.value)}
                      disabled={indexing || commits.length === 0}
                    >
                      <option value="">Choose head…</option>
                      {commits.map((c) => (
                        <option key={c.hash} value={c.hash}>
                          {commitLabel(c)}
                        </option>
                      ))}
                    </select>
                    <span className="path-selector-chevron path-selector-chevron--static" aria-hidden>
                      <ChevronDown size={18} strokeWidth={2} />
                    </span>
                  </>
                )}
              </div>
            </div>

            <label className="git-history-live-toggle">
              <input
                type="checkbox"
                checked={useLiveHead}
                onChange={(e) => onUseLiveHead(e.target.checked)}
              />
              Compare base against <strong>live dev folder</strong> (uncommitted edits)
            </label>
          </div>

          <div className="workspace-setup-actions">
            <button
              type="button"
              className="btn-primary compare-fab"
              disabled={!canCompare}
              onClick={onCompare}
              aria-label={busy ? "Comparing" : "Compare revisions"}
              data-tooltip={busy ? "Comparing…" : "Compare"}
            >
              {busy ? (
                <Loader2 size={17} strokeWidth={2} className="spin-ic" aria-hidden />
              ) : (
                <GitCompareArrows size={17} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>

          {error ? <p className="workspace-error">{error}</p> : null}
        </div>
      </div>
    </header>
  );
}
