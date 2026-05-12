import type { FileChange, FileDiffPayload } from "../app/types";
import type { LlmSettings } from "../app/llmStorage";
import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";
import { ChangedFilesTree } from "./ChangedFilesTree";

type Tab = "summary" | "files";

interface InsightsColumnProps {
  tab: Tab;
  onTab: (t: Tab) => void;
  rows: FileChange[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  diffPayload: FileDiffPayload | null;
  diffLoading: boolean;
  diffError: string | null;
  fileCount: number;
  llmSettings: LlmSettings;
  fileSummary: string | null;
  fileSummaryLoading: boolean;
  fileSummaryError: string | null;
  onRequestFileSummary: () => void;
}

export function InsightsColumn({
  tab,
  onTab,
  rows,
  selectedPath,
  onSelectFile,
  diffPayload,
  diffLoading,
  diffError,
  fileCount,
  llmSettings,
  fileSummary,
  fileSummaryLoading,
  fileSummaryError,
  onRequestFileSummary,
}: InsightsColumnProps) {
  const summaryBody =
    fileCount === 0
      ? "Run a folder comparison to see an overview here."
      : `This comparison includes ${fileCount} changed file${fileCount === 1 ? "" : "s"}. The center pane shows a side-by-side diff for the selected file.`;

  const keyChanges = rows.slice(0, 5).map((r) => ({
    path: r.path,
    label:
      r.kind === "modified"
        ? `Updated ${r.path}`
        : r.kind === "added"
          ? `Added ${r.path}`
          : `Removed ${r.path}`,
  }));

  return (
    <aside className="insights">
      <div className="insights-tabs">
        <button
          type="button"
          className={tab === "summary" ? "insights-tab active" : "insights-tab"}
          onClick={() => onTab("summary")}
        >
          Summary
        </button>
        <button
          type="button"
          className={tab === "files" ? "insights-tab active" : "insights-tab"}
          onClick={() => onTab("files")}
        >
          Files ({fileCount})
        </button>
      </div>

      {tab === "summary" ? (
        <div className="insights-scroll">
          <section className="insights-card">
            <h3 className="insights-card-title">Review summary</h3>
            <p className="insights-prose">{summaryBody}</p>
            {diffError && <p className="insights-alert">{diffError}</p>}
          </section>

          {fileCount > 0 && (
            <section className="insights-card">
              <h3 className="insights-card-title">Key changes</h3>
              <ul className="insights-checklist">
                {keyChanges.map((k) => (
                  <li key={k.path}>{k.label}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="insights-card">
            <h3 className="insights-card-title">File summary (Markdown)</h3>
            <p className="insights-prose llm-mini">
              Provider: <strong>{llmSettings.provider}</strong> ·{" "}
              {llmSettings.baseUrl} · model <code>{llmSettings.model}</code>
            </p>
            <div className="llm-summary-actions">
              <button
                type="button"
                className="llm-summary-btn"
                disabled={
                  !selectedPath ||
                  fileCount === 0 ||
                  fileSummaryLoading ||
                  !window.electronAPI?.llmSummarizeStream
                }
                onClick={() => onRequestFileSummary()}
              >
                {fileSummaryLoading ? "Working…" : "Generate Summary"}
              </button>
            </div>
            {fileSummaryError && (
              <p className="insights-alert">{fileSummaryError}</p>
            )}
            {fileSummary != null && (
              <div className="llm-summary-md-wrap insights-prose">
                <LlmSummaryMarkdown source={fileSummary} />
                {fileSummaryLoading ? (
                  <span className="llm-stream-caret" aria-hidden>
                    ▍
                  </span>
                ) : null}
              </div>
            )}
            {fileSummary == null && !fileSummaryLoading && !fileSummaryError && (
              <p className="insights-footnote">
                LLM replies are <strong>Markdown-only</strong> and shown as a preview.
                Configure provider and model in Settings, then generate a summary for
                the selected file.
              </p>
            )}
          </section>

          <section className="insights-card">
            <h3 className="insights-card-title">Diff stats (selected)</h3>
            <div className="insights-metrics">
              <MetricPill label="Performance impact" value="Positive" tone="good" />
              <MetricPill label="Complexity" value="—" tone="neutral" />
              <MetricPill label="Risk level" value="—" tone="neutral" />
              <MetricPill label="Test coverage" value="—" tone="neutral" />
            </div>
            {diffPayload && !diffLoading && !diffError && (
              <p className="insights-footnote">
                Current file: +{diffPayload.line_additions} / −{diffPayload.line_deletions}{" "}
                lines
                {diffPayload.truncated ? " (truncated)" : ""}.
              </p>
            )}
          </section>
        </div>
      ) : (
        <div className="insights-files">
          <ChangedFilesTree
            rows={rows}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
          />
        </div>
      )}
    </aside>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral" | "warn";
}) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className={`metric-pill ${tone}`}>{value}</span>
    </div>
  );
}
