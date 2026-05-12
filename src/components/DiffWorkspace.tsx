import type { DiffRow, FileDiffPayload } from "../app/types";

interface DiffWorkspaceProps {
  leftRoot: string;
  rightRoot: string;
  onLeft: (v: string) => void;
  onRight: (v: string) => void;
  onBrowseLeft: () => void;
  onBrowseRight: () => void;
  onCompare: () => void;
  busy: boolean;
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
  onToggleFullscreen?: () => void;
}

export function DiffWorkspace({
  leftRoot,
  rightRoot,
  onLeft,
  onRight,
  onBrowseLeft,
  onBrowseRight,
  onCompare,
  busy,
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
  onToggleFullscreen,
}: DiffWorkspaceProps) {
  return (
    <main className="workspace">
      <div className="workspace-setup">
        <div className="path-pair">
          <label className="path-field">
            <span className="path-field-label">Baseline (left)</span>
            <div className="path-field-row">
              <input
                value={leftRoot}
                onChange={(e) => onLeft(e.target.value)}
                placeholder="/path/to/baseline"
                spellCheck={false}
              />
              <button type="button" onClick={onBrowseLeft}>
                Browse…
              </button>
            </div>
          </label>
          <label className="path-field">
            <span className="path-field-label">Target (right)</span>
            <div className="path-field-row">
              <input
                value={rightRoot}
                onChange={(e) => onRight(e.target.value)}
                placeholder="/path/to/target"
                spellCheck={false}
              />
              <button type="button" onClick={onBrowseRight}>
                Browse…
              </button>
            </div>
          </label>
        </div>
        <div className="workspace-setup-actions">
          {onToggleFullscreen && (
            <button
              type="button"
              className="btn-fullscreen"
              onClick={onToggleFullscreen}
              title="Native fullscreen (F11, ⌃⌘F on macOS, or View → Toggle Fullscreen)."
            >
              Fullscreen
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !leftRoot.trim() || !rightRoot.trim()}
            onClick={onCompare}
          >
            {busy ? "Comparing…" : "Compare folders"}
          </button>
        </div>
        {error && <p className="workspace-error">{error}</p>}
      </div>

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
                <span className="branch-arrow" aria-hidden>
                  ←
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
              <span className="file-path-label">File</span>
              <code className="file-path-value">{selectedPath}</code>
            </div>
          )}

          <div className="diff-panes">
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
                      <DiffTableRow key={i} row={row} />
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

      {!compared && !busy && !error && (
        <div className="workspace-empty">
          <p>Choose two folders above, then run a comparison to open the diff workspace.</p>
        </div>
      )}
    </main>
  );
}

function DiffTableRow({ row }: { row: DiffRow }) {
  return (
    <tr>
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
