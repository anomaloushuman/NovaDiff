import type { FileChange, FileDiffPayload } from "../app/types";
import type { LlmSettings } from "../app/llmStorage";
import { isNovadiffDocsReservedPath } from "../app/novadiffPaths";
import { LlmSummaryMarkdown } from "./LlmSummaryMarkdown";
import { ChangedFilesTree } from "./ChangedFilesTree";
import { Check, LayoutList, Loader2, Sparkles } from "lucide-react";

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
  fileSummaryChunk?: { index: number; total: number } | null;
  fileSummaryError: string | null;
  fileSummaryDisabledReason?: string | null;
  onRequestFileSummary: () => void;
  prefetchStatus?: string | null;
  prefetchProgress?: { current: number; total: number } | null;
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
  fileSummaryChunk,
  fileSummaryError,
  fileSummaryDisabledReason,
  onRequestFileSummary,
  prefetchStatus,
  prefetchProgress,
}: InsightsColumnProps) {
  const summaryEvidence = diffPayload?.summary_evidence;
  const warnBadgeCount = (summaryEvidence?.badges ?? []).filter(
    (badge) => badge.tone === "warn",
  ).length;
  const riskLevel =
    warnBadgeCount >= 2 ? "Elevated" : warnBadgeCount === 1 ? "Scoped" : "Low";
  const riskTone = warnBadgeCount >= 2 ? "warn" : warnBadgeCount === 1 ? "neutral" : "good";
  const symbolValue =
    (summaryEvidence?.touched_symbols?.length ?? 0) > 0
      ? `${summaryEvidence?.touched_symbols.length} touched`
      : "No symbols";
  const verificationValue =
    (summaryEvidence?.verification_hints?.length ?? 0) > 0
      ? `${summaryEvidence?.verification_hints.length} hints`
      : "None";
  const evidenceValue =
    (summaryEvidence?.cited_changed_lines?.length ?? 0) > 0
      ? `${summaryEvidence?.cited_changed_lines.length} citations`
      : "Sparse";

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
          <Sparkles size={15} strokeWidth={2} className="insights-tab-icon" aria-hidden />
          Summary
        </button>
        <button
          type="button"
          className={tab === "files" ? "insights-tab active" : "insights-tab"}
          onClick={() => onTab("files")}
        >
          <LayoutList size={15} strokeWidth={2} className="insights-tab-icon" aria-hidden />
          Files ({fileCount})
        </button>
      </div>

      {tab === "summary" ? (
        <div key="summary" className="insights-scroll insights-panel-enter">
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
                  <li key={k.path}>
                    <Check
                      size={14}
                      strokeWidth={2.5}
                      className="insights-check-icon"
                      aria-hidden
                    />
                    {k.label}
                  </li>
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
                  Boolean(fileSummaryDisabledReason) ||
                  isNovadiffDocsReservedPath(selectedPath) ||
                  fileCount === 0 ||
                  fileSummaryLoading ||
                  (!window.electronAPI?.llmSummarizeStream &&
                    !window.electronAPI?.llmSummarize)
                }
                onClick={() => onRequestFileSummary()}
              >
                {fileSummaryLoading ? (
                  <>
                    <Loader2 size={17} strokeWidth={2} className="spin-ic" aria-hidden />
                    {fileSummaryChunk
                      ? `Part ${fileSummaryChunk.index}/${fileSummaryChunk.total}…`
                      : "Working…"}
                  </>
                ) : (
                  <>
                    <Sparkles size={17} strokeWidth={2} aria-hidden />
                    Generate summary
                  </>
                )}
              </button>
            </div>
            {fileSummaryLoading && fileSummaryChunk && fileSummaryChunk.total > 1 ? (
              <p className="insights-footnote insights-chunk-hint">
                Large diff: summarizing in {fileSummaryChunk.total} large passes to keep
                full-file coverage without exploding into hundreds of tiny requests.
              </p>
            ) : null}
            {selectedPath && isNovadiffDocsReservedPath(selectedPath) && (
              <p className="insights-footnote">
                <code>novadiff-docs/</code> is reserved for NovaDiff-generated bundles and
                is excluded from per-file summaries and prefetch.
              </p>
            )}
            {selectedPath &&
            fileSummaryDisabledReason &&
            !isNovadiffDocsReservedPath(selectedPath) ? (
              <p className="insights-footnote">{fileSummaryDisabledReason}</p>
            ) : null}
            {fileSummaryError && (
              <p className="insights-alert">{fileSummaryError}</p>
            )}
            {prefetchStatus ? (
              <div className="insights-prefetch-status doc-state-enter">
                <p className="insights-footnote">{prefetchStatus}</p>
                {prefetchProgress && prefetchProgress.total > 0 ? (
                  <div className="insights-prefetch-track" aria-hidden>
                    <div
                      className="insights-prefetch-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (prefetchProgress.current / prefetchProgress.total) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="insights-prefetch-track is-indeterminate" aria-hidden>
                    <div className="insights-prefetch-fill" />
                  </div>
                )}
              </div>
            ) : null}
            {fileSummary != null && (
              <div className="llm-summary-md-wrap insights-prose">
                <LlmSummaryMarkdown source={fileSummary} />
                {fileSummaryLoading ? (
                  <Loader2 size={14} strokeWidth={2} className="llm-stream-caret" aria-hidden />
                ) : null}
              </div>
            )}
            {fileSummary == null && !fileSummaryLoading && !fileSummaryError && (
              <p className="insights-footnote">
                LLM replies are <strong>Markdown-only</strong> and shown as a preview.
                Very large files use <strong>a few extraction passes plus one final
                synthesis</strong>{" "}
                by default, tuned for high-context local models so the result stays
                shorter and faster. Configure provider and model in Settings, then
                generate a summary for the selected file. Each completed summary
                (prefetch or manual) is also
                written under the target tree as{" "}
                <code>novadiff-docs/summaries/…/summary.html</code> and{" "}
                <code>summary.pdf</code>.
              </p>
            )}
          </section>

          <section className="insights-card">
            <h3 className="insights-card-title">Diff stats (selected)</h3>
            <div className="insights-metrics">
              <MetricPill
                label="Evidence anchors"
                value={evidenceValue}
                tone={summaryEvidence ? "good" : "neutral"}
              />
              <MetricPill
                label="Touched symbols"
                value={symbolValue}
                tone={(summaryEvidence?.touched_symbols?.length ?? 0) > 0 ? "good" : "neutral"}
              />
              <MetricPill label="Risk level" value={riskLevel} tone={riskTone} />
              <MetricPill
                label="Verification"
                value={verificationValue}
                tone={(summaryEvidence?.verification_hints?.length ?? 0) > 0 ? "good" : "neutral"}
              />
            </div>
            {diffPayload && !diffLoading && !diffError && (
              <p className="insights-footnote">
                Current file: +{diffPayload.line_additions} / −{diffPayload.line_deletions}{" "}
                lines
                {diffPayload.truncated ? " (truncated)" : ""}.
              </p>
            )}
            {summaryEvidence?.badges && summaryEvidence.badges.length > 0 ? (
              <div className="doc-workspace-confidence-badges">
                {summaryEvidence.badges.map((badge) => (
                  <span
                    key={badge.key}
                    className={`doc-workspace-inline-badge ${badge.tone}`}
                    title={badge.description}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <div key="files" className="insights-files insights-panel-enter">
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
