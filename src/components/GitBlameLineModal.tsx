import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import type { GitBlameAtRefResult } from "../app/gitTypes";

export interface GitBlameLineModalProps {
  open: boolean;
  relPath: string;
  blame: GitBlameAtRefResult | null;
  fileContent: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function GitBlameLineModal({
  open,
  relPath,
  blame,
  fileContent,
  loading,
  error,
  onClose,
}: GitBlameLineModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const lines = fileContent.split(/\r?\n/);

  return (
    <div
      className="git-blame-modal-backdrop summary-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="git-blame-modal summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="git-blame-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="summary-modal-header">
          <div>
            <h2 id="git-blame-modal-title">Line-by-line blame</h2>
            <p className="summary-modal-kicker">{relPath}</p>
          </div>
          <button
            type="button"
            className="summary-modal-close"
            onClick={onClose}
            aria-label="Close blame view"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        {error ? <p className="summary-modal-error">{error}</p> : null}

        <div className="summary-modal-body git-blame-modal-body">
          {loading ? (
            <p className="summary-modal-loading">
              <Loader2 size={22} className="spin-ic summary-modal-spinner" aria-hidden />
              Loading blame…
            </p>
          ) : (
            <>
              {blame?.owners && blame.owners.length > 0 ? (
                <div className="git-blame-owners">
                  {blame.owners.map((o) => (
                    <span key={o.author} className="doc-workspace-inline-badge">
                      {o.author} ({Math.round(o.ratio * 100)}%)
                    </span>
                  ))}
                </div>
              ) : null}
              {blame?.error ? <p className="doc-workspace-alert">{blame.error}</p> : null}
              {lines.length > 0 ? (
                <pre className="git-blame-code git-blame-code--modal">
                  {lines.map((line, i) => {
                    const author = blame?.lineAuthors[i] ?? "";
                    return (
                      <div key={`${i}-${author}`} className="git-blame-line">
                        <span className="git-blame-ln">{i + 1}</span>
                        <span className="git-blame-author" title={author}>
                          {(author || "?").slice(0, 14)}
                        </span>
                        <span className="git-blame-text">{line || " "}</span>
                      </div>
                    );
                  })}
                </pre>
              ) : (
                <p className="doc-workspace-muted">No file content available.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
