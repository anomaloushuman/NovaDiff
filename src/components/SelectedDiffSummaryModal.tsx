import { X } from "lucide-react";
import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";
import { AnimatedOverlay } from "./ui/AnimatedOverlay";

export interface SelectedDiffSummaryModalProps {
  open: boolean;
  label: string | null;
  summary: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function SelectedDiffSummaryModal({
  open,
  label,
  summary,
  loading,
  error,
  onClose,
}: SelectedDiffSummaryModalProps) {
  return (
    <AnimatedOverlay
      open={open}
      onClose={onClose}
      backdropClassName="summary-modal-backdrop"
      panelClassName="summary-modal"
      labelledBy="summary-modal-title"
    >
      <header className="summary-modal-header">
        <div className="summary-modal-header-text">
          <h2 id="summary-modal-title">Selection documentation</h2>
          {label ? <p className="summary-modal-kicker">{label}</p> : null}
        </div>
        <button
          type="button"
          className="summary-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} aria-hidden />
        </button>
      </header>

      {error ? <p className="summary-modal-error">{error}</p> : null}

      <div className="summary-modal-body llm-summary-md-wrap">
        {loading && !summary?.trim() ? (
          <div className="summary-modal-loading">
            <span className="summary-modal-spinner" aria-hidden />
            <p>Analyzing selected lines…</p>
          </div>
        ) : null}
        {summary ? <LlmSummaryMarkdown source={summary} /> : null}
        {loading && summary?.trim() ? (
          <span className="llm-stream-caret" aria-hidden>
            ▍
          </span>
        ) : null}
      </div>
    </AnimatedOverlay>
  );
}
