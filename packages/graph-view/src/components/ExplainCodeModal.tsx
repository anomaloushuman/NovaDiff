import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export interface ExplainCodeModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  text: string;
  loading: boolean;
  error: string | null;
  savedHint?: string | null;
  onClose: () => void;
}

export function ExplainCodeModal({
  open,
  title,
  subtitle,
  text,
  loading,
  error,
  savedHint,
  onClose,
}: ExplainCodeModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !loading) {
      return;
    }
    const el = bodyRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [open, loading, text]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="novadiff-explain-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explain-code-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="novadiff-explain-modal" onMouseDown={(e) => e.stopPropagation()}>
        <header className="novadiff-explain-modal-head">
          <div className="min-w-0">
            <h2 id="explain-code-title" className="novadiff-explain-modal-title">
              {title}
            </h2>
            {subtitle ? (
              <p className="novadiff-explain-modal-subtitle">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="novadiff-explain-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div ref={bodyRef} className="novadiff-explain-modal-body">
          {error ? <p className="novadiff-explain-modal-error">{error}</p> : null}
          {text ? (
            <div className="novadiff-explain-modal-md">
              <ReactMarkdown>{text}</ReactMarkdown>
              {loading ? (
                <span className="novadiff-explain-stream-caret" aria-hidden>
                  ▍
                </span>
              ) : null}
            </div>
          ) : loading ? (
            <p className="novadiff-explain-modal-placeholder">Waiting for model…</p>
          ) : null}
        </div>
        <footer className="novadiff-explain-modal-foot">
          {savedHint ? <span className="novadiff-explain-modal-saved">{savedHint}</span> : null}
          <button
            type="button"
            className="novadiff-explain-modal-done"
            onClick={onClose}
            disabled={loading}
          >
            {loading ? "Streaming…" : "Done"}
          </button>
        </footer>
      </div>
    </div>
  );
}
