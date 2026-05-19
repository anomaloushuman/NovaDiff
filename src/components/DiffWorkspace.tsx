import type { MouseEvent } from "react";
import type {
  DiffRow,
  FileDiffPayload,
  SelectionDocMode,
} from "../app/types";
import {
  ArrowLeftRight,
  ChevronDown,
  FileCode,
  GitBranch,
  GitCompareArrows,
  Loader2,
} from "lucide-react";
import { SelectedDiffSummaryModal } from "./SelectedDiffSummaryModal";

interface DiffWorkspaceProps {
  leftRoot: string;
  rightRoot: string;
  onLeft: (v: string) => void;
  onRight: (v: string) => void;
  onBrowseLeft: () => void;
  onBrowseRight: () => void;
  onSwapRoots: () => void;
  onCompare: () => void;
  busy: boolean;
  compareStatusMessage?: string | null;
  error: string | null;
  compared: boolean;
  leftTitle: string;
  rightTitle: string;
  fileCount: number;
  addedFiles: number;
  removedFiles: number;
  modifiedFiles: number;
  selectedPath: string | null;
  diffPayload: FileDiffPayload | null;
  diffLoading: boolean;
  diffError: string | null;
  selectedDiffRows: number[];
  selectionMode: SelectionDocMode;
  onSelectionMode: (mode: SelectionDocMode) => void;
  onSelectDiffRow: (
    rowIndex: number,
    modifiers: { shiftKey: boolean; toggleKey: boolean },
  ) => void;
  onClearDiffSelection: () => void;
  onRequestSelectedDiffSummary: () => void;
  selectedDiffDocLabel: string | null;
  selectedDiffDocNote: string | null;
  selectedDiffChangedCount: number;
  selectedDiffSummary: string | null;
  selectedDiffSummaryLoading: boolean;
  selectedDiffSummaryError: string | null;
  selectedDiffSummaryModalOpen: boolean;
  onCloseSelectedDiffSummaryModal: () => void;
}

export function DiffWorkspace({
  leftRoot,
  rightRoot,
  onLeft,
  onRight,
  onBrowseLeft,
  onBrowseRight,
  onSwapRoots,
  onCompare,
  busy,
  compareStatusMessage,
  error,
  compared,
  leftTitle,
  rightTitle,
  fileCount,
  addedFiles,
  removedFiles,
  modifiedFiles,
  selectedPath,
  diffPayload,
  diffLoading,
  diffError,
  selectedDiffRows,
  selectionMode,
  onSelectionMode,
  onSelectDiffRow,
  onClearDiffSelection,
  onRequestSelectedDiffSummary,
  selectedDiffDocLabel,
  selectedDiffDocNote,
  selectedDiffChangedCount,
  selectedDiffSummary,
  selectedDiffSummaryLoading,
  selectedDiffSummaryError,
  selectedDiffSummaryModalOpen,
  onCloseSelectedDiffSummaryModal,
}: DiffWorkspaceProps) {
  const hasDiffSelection = selectedDiffRows.length > 0;
  return (
    <main className="workspace">
      <div className="workspace-setup-strip">
        <div className="workspace-setup">
          <div className="path-selectors-group">
            <div className="path-selectors-labels" aria-hidden>
              <span className="path-field-label">
                Base <span className="path-field-hint">tree</span>
              </span>
              <span className="path-field-label path-swap-label-filler">
                Base <span className="path-field-hint">tree</span>
              </span>
              <span className="path-field-label">
                Target <span className="path-field-hint">tree</span>
              </span>
            </div>

            <div className="path-selectors-combined">
              <div className="path-selector-segment">
                <span className="path-selector-lead-icon" aria-hidden>
                  <GitBranch size={17} strokeWidth={2} />
                </span>
                <input
                  id="novadiff-path-baseline"
                  className="path-selector-input"
                  aria-label="Base tree"
                  value={leftRoot}
                  onChange={(e) => onLeft(e.target.value)}
                  placeholder="Select base…"
                  spellCheck={false}
                  autoComplete="off"
                  title={leftRoot.trim() || undefined}
                />
                <button
                  type="button"
                  className="path-selector-chevron"
                  onClick={() => void onBrowseLeft()}
                  aria-label="Browse for baseline folder"
                >
                  <ChevronDown size={18} strokeWidth={2} aria-hidden />
                </button>
              </div>

              <button
                type="button"
                className="path-swap-btn path-swap-btn-joined"
                onClick={onSwapRoots}
                disabled={busy}
                title="Swap baseline and target folders"
                aria-label="Swap baseline and target folders"
              >
                <ArrowLeftRight size={18} strokeWidth={2} aria-hidden />
              </button>

              <div className="path-selector-segment">
                <span className="path-selector-lead-icon" aria-hidden>
                  <GitBranch size={17} strokeWidth={2} />
                </span>
                <input
                  id="novadiff-path-target"
                  className="path-selector-input"
                  aria-label="Target right tree"
                  value={rightRoot}
                  onChange={(e) => onRight(e.target.value)}
                  placeholder="Select target…"
                  spellCheck={false}
                  autoComplete="off"
                  title={rightRoot.trim() || undefined}
                />
                <button
                  type="button"
                  className="path-selector-chevron"
                  onClick={() => void onBrowseRight()}
                  aria-label="Browse for target folder"
                >
                  <ChevronDown size={18} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="workspace-setup-actions">
            <button
              type="button"
              className="btn-primary compare-fab"
              disabled={busy || !leftRoot.trim() || !rightRoot.trim()}
              onClick={onCompare}
              aria-label={busy ? "Comparing folders" : "Compare folders"}
              data-tooltip={busy ? "Comparing..." : "Compare"}
            >
              {busy ? (
                <Loader2 size={17} strokeWidth={2} className="spin-ic" aria-hidden />
              ) : (
                <GitCompareArrows size={17} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
          {error && <p className="workspace-error">{error}</p>}
        </div>
      </div>

      {busy ? (
        <div className="workspace-activity-banner doc-state-enter" role="status" aria-live="polite">
          <Loader2 size={16} strokeWidth={2} className="spin-ic" aria-hidden />
          <div className="workspace-activity-banner-text">
            <strong>Comparing folders</strong>
            <span>{compareStatusMessage ?? "Rust engine is scanning and hashing files…"}</span>
          </div>
          <div className="workspace-activity-track is-indeterminate" aria-hidden>
            <div className="workspace-activity-fill" />
          </div>
        </div>
      ) : null}

      {compared && fileCount === 0 && (
        <p className="workspace-note">No differences found between these folders.</p>
      )}

      {compared && fileCount > 0 && (
        <>
          <header className="workspace-header">
            <div>
              <h1 className="workspace-heading">Comparing changes</h1>
              <div className="workspace-branches">
                <span className="branch-pill">{leftTitle}</span>
                <span className="branch-arrow" aria-hidden title="Baseline → target">
                  ⇄
                </span>
                <span className="branch-pill accent">{rightTitle}</span>
              </div>
              <div className="workspace-stats">
                <span className="stat-add">+{addedFiles} added</span>
                <span className="stat-sep">·</span>
                <span className="stat-del">−{removedFiles} removed</span>
                <span className="stat-sep">·</span>
                <span className="stat-mod">{modifiedFiles} modified</span>
                <span className="stat-sep">·</span>
                <span className="stat-muted">{fileCount} files</span>
              </div>
            </div>
          </header>

          {selectedPath && (
            <div className="file-path-bar">
              <FileCode size={16} strokeWidth={2} className="file-path-bar-icon" aria-hidden />
              <span className="file-path-label">File</span>
              <code className="file-path-value">{selectedPath}</code>
            </div>
          )}

          <div className="diff-panes">
            {hasDiffSelection ? (
              <div className="diff-selection-bar">
                <div className="diff-selection-copy">
                  <strong>{selectedDiffRows.length}</strong> row
                  {selectedDiffRows.length === 1 ? "" : "s"} selected
                  {selectedDiffChangedCount > 0
                    ? ` · ${selectedDiffChangedCount} changed`
                    : " · no changed rows"}
                  {selectedDiffDocLabel ? (
                    <>
                      {" "}
                      · <span className="diff-selection-label">{selectedDiffDocLabel}</span>
                    </>
                  ) : null}
                </div>
                <div className="diff-selection-actions">
                  <div className="diff-selection-mode" role="group" aria-label="Selection mode">
                    <button
                      type="button"
                      className={
                        selectionMode === "exact"
                          ? "diff-selection-mode-btn active"
                          : "diff-selection-mode-btn"
                      }
                      onClick={() => onSelectionMode("exact")}
                    >
                      Exact selection
                    </button>
                    <button
                      type="button"
                      className={
                        selectionMode === "expanded"
                          ? "diff-selection-mode-btn active"
                          : "diff-selection-mode-btn"
                      }
                      onClick={() => onSelectionMode("expanded")}
                    >
                      Expand to symbol
                    </button>
                  </div>
                  <button
                    type="button"
                    className="diff-selection-secondary"
                    onClick={onClearDiffSelection}
                    disabled={selectedDiffSummaryLoading}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="diff-selection-primary"
                    onClick={onRequestSelectedDiffSummary}
                    disabled={selectedDiffSummaryLoading || selectedDiffChangedCount === 0}
                  >
                    {selectedDiffSummaryLoading ? "Documenting…" : "Document selection"}
                  </button>
                </div>
                {selectedDiffDocNote ? (
                  <p className="diff-selection-note">{selectedDiffDocNote}</p>
                ) : null}
                {selectedDiffSummaryError ? (
                  <p className="diff-selection-error">{selectedDiffSummaryError}</p>
                ) : null}
              </div>
            ) : null}
            <div className="diff-pane-head">
              <span>{leftTitle}</span>
              <span>{rightTitle}</span>
            </div>
            <div className="diff-pane-body">
              {diffLoading && <div className="diff-placeholder">Loading diff…</div>}
              {!diffLoading && diffError && (
                <div className="diff-placeholder error">{diffError}</div>
              )}
              {!diffLoading && !diffError && diffPayload && diffPayload.rows.length === 0 && (
                <div className="diff-placeholder">No lines to show (empty file).</div>
              )}
              {!diffLoading && !diffError && diffPayload && diffPayload.rows.length > 0 && (
                <table className="diff-table">
                  <tbody>
                    {diffPayload.rows.map((row, i) => (
                      <DiffTableRow
                        key={row.row_id}
                        row={row}
                        selected={selectedDiffRows.includes(i)}
                        selectable={!row.is_truncation_marker}
                        onClick={(event) =>
                          onSelectDiffRow(i, {
                            shiftKey: event.shiftKey,
                            toggleKey: event.metaKey || event.ctrlKey,
                          })
                        }
                      />
                    ))}
                  </tbody>
                </table>
              )}
              {!diffLoading && !diffError && !diffPayload && selectedPath && (
                <div className="diff-placeholder">Loading or select another file in Files →</div>
              )}
            </div>
          </div>
        </>
      )}

      <SelectedDiffSummaryModal
        open={selectedDiffSummaryModalOpen}
        label={selectedDiffDocLabel}
        summary={selectedDiffSummary}
        loading={selectedDiffSummaryLoading}
        error={selectedDiffSummaryError}
        onClose={onCloseSelectedDiffSummaryModal}
      />

      {!compared && !busy && !error && (
        <div className="workspace-empty">
          <p>Choose two folders above, then run a comparison to open the diff workspace.</p>
        </div>
      )}
    </main>
  );
}

function DiffTableRow({
  row,
  selected,
  selectable,
  onClick,
}: {
  row: DiffRow;
  selected: boolean;
  selectable: boolean;
  onClick: (event: MouseEvent<HTMLTableRowElement>) => void;
}) {
  return (
    <tr
      className={
        selected ? "diff-row diff-row-selected" : selectable ? "diff-row" : "diff-row muted"
      }
      onClick={selectable ? onClick : undefined}
      aria-selected={selected || undefined}
    >
      <td className="diff-gutter">{row.left_no ?? ""}</td>
      <td className={`diff-code ${row.left_style}`}>
        <pre>{row.left}</pre>
      </td>
      <td className="diff-gutter">{row.right_no ?? ""}</td>
      <td className={`diff-code ${row.right_style}`}>
        <pre>{row.right}</pre>
      </td>
    </tr>
  );
}
