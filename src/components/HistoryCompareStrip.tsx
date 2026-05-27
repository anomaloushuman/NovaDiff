import {
  ArrowLeftRight,
  ChevronDown,
  GitBranch,
  GitCompareArrows,
  Loader2,
} from "lucide-react";
import type { GitBranchSummary } from "../app/gitTypes";
import { branchOptionLabel } from "../app/gitHistoryBranches";
import { pathDisplayLabel } from "../app/pathDisplay";

export interface HistoryCompareStripProps {
  branches: GitBranchSummary[];
  branchesLoading: boolean;
  branchLoadError: string | null;
  baseBranch: string;
  headBranch: string;
  useLiveHead: boolean;
  liveRepoRoot: string;
  busy: boolean;
  error: string | null;
  loading: boolean;
  onBaseBranch: (branch: string) => void;
  onHeadBranch: (branch: string) => void;
  onUseLiveHead: (live: boolean) => void;
  onBrowseLiveRepo: () => void;
  onLiveRepoBlur?: () => void;
  onSwap: () => void;
  onCompare: () => void;
}

export function HistoryCompareStrip({
  branches,
  branchesLoading,
  branchLoadError,
  baseBranch,
  headBranch,
  useLiveHead,
  liveRepoRoot,
  busy,
  error,
  loading,
  onBaseBranch,
  onHeadBranch,
  onUseLiveHead,
  onBrowseLiveRepo,
  onLiveRepoBlur,
  onSwap,
  onCompare,
}: HistoryCompareStripProps) {
  const baseMeta = branches.find((b) => b.name === baseBranch) ?? null;
  const headMeta = branches.find((b) => b.name === headBranch) ?? null;
  const branchSelectDisabled = loading || branchesLoading || branches.length === 0;
  const canCompare =
    Boolean(baseMeta) &&
    !loading &&
    !busy &&
    !branchesLoading &&
    (useLiveHead
      ? Boolean(liveRepoRoot.trim())
      : Boolean(headMeta && baseMeta && baseMeta.hash !== headMeta.hash));

  return (
    <header className="git-history-header">
      <div className="git-history-header-copy">
        <h1 className="git-history-title">
          Change <span className="git-history-title-accent">history</span>
        </h1>
        <p className="git-history-lead">
          Choose a <strong>base</strong> branch and a <strong>target</strong> branch to compare their
          latest commits. Pick specific commits in the list below, or compare against your live dev
          folder.
        </p>
      </div>

      <div className="workspace-setup-strip git-history-setup-strip git-history-compare-card">
        <div className="workspace-setup git-history-setup">
          <div className="path-selectors-group">
            <div className="path-selectors-labels" aria-hidden>
              <span className="path-field-label git-history-field-label">
                Base <span className="path-field-hint">branch</span>
                {baseMeta ? (
                  <span className="git-history-badge git-history-label-badge">Base</span>
                ) : null}
              </span>
              <span className="path-field-label path-swap-label-filler" aria-hidden="true">
                &nbsp;
              </span>
              <span className="path-field-label git-history-field-label">
                Target <span className="path-field-hint">branch</span>
                {headMeta && !useLiveHead ? (
                  <span className="git-history-badge git-history-badge--head git-history-label-badge">
                    Target
                  </span>
                ) : null}
              </span>
            </div>

            <div className="path-selectors-combined">
              <div className="path-selector-segment path-selector-segment--select git-history-selector-segment">
                <span className="path-selector-lead-icon" aria-hidden>
                  <GitBranch size={17} strokeWidth={2} />
                </span>
                <select
                  id="git-history-base-branch"
                  className="path-selector-input path-selector-select"
                  aria-label="Base branch"
                  value={baseBranch}
                  onChange={(e) => onBaseBranch(e.target.value)}
                  disabled={branchSelectDisabled}
                >
                  {branchesLoading ? (
                    <option value="">Loading branches…</option>
                  ) : branches.length === 0 ? (
                    <option value="">No branches found</option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Choose base branch…
                      </option>
                      {branches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {branchOptionLabel(b)}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <span className="path-selector-chevron path-selector-chevron--static" aria-hidden>
                  <ChevronDown size={18} strokeWidth={2} />
                </span>
              </div>

              <button
                type="button"
                className="path-swap-btn path-swap-btn-joined"
                onClick={onSwap}
                disabled={busy || loading || branchesLoading}
                title="Swap base and target branches"
                aria-label="Swap base and target branches"
              >
                <ArrowLeftRight size={18} strokeWidth={2} aria-hidden />
              </button>

              <div
                className={`path-selector-segment git-history-selector-segment${useLiveHead ? "" : " path-selector-segment--select"}`}
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
                      value={pathDisplayLabel(liveRepoRoot)}
                      readOnly
                      onBlur={() => onLiveRepoBlur?.()}
                      placeholder="Browse for live clone…"
                      spellCheck={false}
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
                      id="git-history-head-branch"
                      className="path-selector-input path-selector-select"
                      aria-label="Target branch"
                      value={headBranch}
                      onChange={(e) => onHeadBranch(e.target.value)}
                      disabled={branchSelectDisabled}
                    >
                      {branchesLoading ? (
                        <option value="">Loading branches…</option>
                      ) : branches.length === 0 ? (
                        <option value="">No branches found</option>
                      ) : (
                        <>
                          <option value="" disabled>
                            Choose target branch…
                          </option>
                          {branches.map((b) => (
                            <option key={b.name} value={b.name}>
                              {branchOptionLabel(b)}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <span className="path-selector-chevron path-selector-chevron--static" aria-hidden>
                      <ChevronDown size={18} strokeWidth={2} />
                    </span>
                  </>
                )}
              </div>
            </div>

            {baseMeta && !useLiveHead && headMeta ? (
              <p className="git-history-branch-hint doc-workspace-muted">
                Comparing <code>{baseMeta.shortHash}</code> on <strong>{baseBranch}</strong> →{" "}
                <code>{headMeta.shortHash}</code> on <strong>{headBranch}</strong>
              </p>
            ) : null}

            <label className="git-history-live-toggle">
              <input
                type="checkbox"
                checked={useLiveHead}
                onChange={(e) => onUseLiveHead(e.target.checked)}
              />
              Compare base branch against <strong>live dev folder</strong> (uncommitted edits)
            </label>
          </div>

          <div className="workspace-setup-actions">
            <button
              type="button"
              className="btn-primary compare-fab"
              disabled={!canCompare}
              onClick={onCompare}
              aria-label={busy ? "Comparing" : "Compare branches"}
              data-tooltip={busy ? "Comparing…" : "Compare"}
            >
              {busy ? (
                <Loader2 size={17} strokeWidth={2} className="spin-ic" aria-hidden />
              ) : (
                <GitCompareArrows size={17} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>

          {branchLoadError ? <p className="workspace-error">{branchLoadError}</p> : null}
          {error ? <p className="workspace-error">{error}</p> : null}
        </div>
      </div>
    </header>
  );
}
