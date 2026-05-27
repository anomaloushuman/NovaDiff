import { useCallback, useEffect, useMemo, useState } from "react";
import type { FileChange, RiskSignal, SecurityInsightReport } from "../app/types";
import {
  groupSecuritySignals,
  mergeRiskSignals,
} from "../app/securityInsights";

const ADVISORY_TOGGLE_KEY = "novadiff_insights_advisory_enabled";

function loadAdvisoryDefault(): boolean {
  try {
    return localStorage.getItem(ADVISORY_TOGGLE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface InsightsWorkspaceProps {
  compared: boolean;
  leftRoot: string;
  rightRoot: string;
  rows: FileChange[];
  onJumpToCompare: (path: string) => void;
}

function RiskSection({
  title,
  subtitle,
  items,
  onJumpToCompare,
}: {
  title: string;
  subtitle: string;
  items: RiskSignal[];
  onJumpToCompare: (path: string) => void;
}) {
  return (
    <section className="insights-workspace-panel">
      <h2 className="doc-workspace-h2">{title}</h2>
      <p className="doc-workspace-prose">{subtitle}</p>
      {items.length === 0 ? (
        <p className="doc-workspace-muted">No findings in this category.</p>
      ) : (
        <div className="doc-workspace-risk-list">
          {items.map((signal) => (
            <article
              key={signal.id}
              className={`doc-workspace-risk-card severity-${signal.severity}`}
            >
              <div className="doc-workspace-risk-head">
                <div>
                  <strong>{signal.title}</strong>
                  <p className="doc-workspace-muted">
                    {signal.category} · {signal.severity} · {signal.confidence} confidence ·{" "}
                    {signal.source}
                  </p>
                </div>
                {signal.rel_path ? (
                  <button
                    type="button"
                    className="doc-workspace-copy-btn"
                    onClick={() => onJumpToCompare(signal.rel_path ?? "")}
                  >
                    Open diff
                  </button>
                ) : null}
              </div>
              {signal.evidence.length > 0 ? (
                <ul className="doc-workspace-risk-evidence">
                  {signal.evidence.map((item, idx) => (
                    <li key={`${signal.id}-${idx}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function InsightsWorkspace({
  compared,
  leftRoot,
  rightRoot,
  rows,
  onJumpToCompare,
}: InsightsWorkspaceProps) {
  const [heuristicSignals, setHeuristicSignals] = useState<RiskSignal[]>([]);
  const [heuristicLoading, setHeuristicLoading] = useState(false);
  const [heuristicError, setHeuristicError] = useState<string | null>(null);
  const [advisoryEnabled, setAdvisoryEnabled] = useState(loadAdvisoryDefault);
  const [advisoryReport, setAdvisoryReport] = useState<SecurityInsightReport | null>(null);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryError, setAdvisoryError] = useState<string | null>(null);

  const projectRoot = rightRoot.trim() || leftRoot.trim();

  useEffect(() => {
    try {
      localStorage.setItem(ADVISORY_TOGGLE_KEY, advisoryEnabled ? "1" : "0");
    } catch {
      // ignore storage failures
    }
  }, [advisoryEnabled]);

  const runHeuristicScan = useCallback(() => {
    const api = window.electronAPI;
    if (!api?.scanRiskSignals || !compared || rows.length === 0) {
      setHeuristicSignals([]);
      setHeuristicLoading(false);
      setHeuristicError(null);
      return;
    }
    const left = leftRoot.trim();
    const right = rightRoot.trim();
    if (!left || !right) {
      setHeuristicSignals([]);
      setHeuristicError("Both baseline and target roots are required.");
      return;
    }
    let cancelled = false;
    setHeuristicLoading(true);
    setHeuristicError(null);
    void api
      .scanRiskSignals({
        leftRoot: left,
        rightRoot: right,
        changes: rows,
      })
      .then((signals) => {
        if (!cancelled) {
          setHeuristicSignals(Array.isArray(signals) ? signals : []);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setHeuristicSignals([]);
          setHeuristicError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHeuristicLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [compared, leftRoot, rightRoot, rows]);

  useEffect(() => {
    const cleanup = runHeuristicScan();
    return cleanup;
  }, [runHeuristicScan]);

  const runAdvisoryScan = useCallback(() => {
    const api = window.electronAPI;
    if (!api?.scanSecurityInsights || !projectRoot) {
      setAdvisoryReport(null);
      setAdvisoryLoading(false);
      setAdvisoryError(
        !projectRoot ? "A project root is required for advisory scans." : "Advisory scanner is unavailable.",
      );
      return;
    }
    let cancelled = false;
    setAdvisoryLoading(true);
    setAdvisoryError(null);
    void api
      .scanSecurityInsights({
        projectRoot,
        changes: rows,
        advisoryEnabled,
      })
      .then((report) => {
        if (!cancelled) {
          setAdvisoryReport(report ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setAdvisoryReport(null);
          setAdvisoryError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAdvisoryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [advisoryEnabled, projectRoot, rows]);

  useEffect(() => {
    if (!advisoryEnabled) {
      setAdvisoryReport(null);
      setAdvisoryError(null);
      setAdvisoryLoading(false);
      return;
    }
    const cleanup = runAdvisoryScan();
    return cleanup;
  }, [advisoryEnabled, runAdvisoryScan]);

  const allSignals = useMemo(
    () => mergeRiskSignals(heuristicSignals, advisoryReport?.signals ?? []),
    [heuristicSignals, advisoryReport?.signals],
  );
  const groups = useMemo(() => groupSecuritySignals(allSignals), [allSignals]);

  if (!compared || rows.length === 0) {
    return (
      <main className="insights-workspace insights-workspace--empty">
        <p className="doc-workspace-lead">
          Run a folder comparison first. The Insights workspace performs deterministic and advisory
          security checks against the current compare scope.
        </p>
      </main>
    );
  }

  return (
    <main className="insights-workspace">
      <header className="doc-workspace-header">
        <div>
          <h1 className="doc-workspace-title">Security insights</h1>
          <p className="doc-workspace-sub">
            Focused findings for vulnerabilities, dependency/config risk, memory leak indicators, and
            function completeness.
          </p>
        </div>
      </header>

      <section className="insights-workspace-panel">
        <h2 className="doc-workspace-h2">Scan controls</h2>
        <p className="doc-workspace-prose">
          Heuristic scans run locally from the compare engine. Advisory scans are opt-in and attempt
          multi-ecosystem coverage (Node, Python, Rust, Go, Ruby, plus universal OSV scanner when
          available).
        </p>
        <label className="doc-workspace-check">
          <input
            type="checkbox"
            checked={advisoryEnabled}
            onChange={(e) => setAdvisoryEnabled(e.target.checked)}
          />
          Enable advisory network scans (CVE/dependency audit)
        </label>
        <div className="doc-workspace-commit-actions">
          <button
            type="button"
            className="doc-workspace-copy-btn"
            onClick={runHeuristicScan}
            disabled={heuristicLoading}
          >
            {heuristicLoading ? "Running heuristic scan…" : "Re-run heuristic scan"}
          </button>
          <button
            type="button"
            className="doc-workspace-copy-btn"
            onClick={runAdvisoryScan}
            disabled={!advisoryEnabled || advisoryLoading}
          >
            {advisoryLoading ? "Running advisory scan…" : "Run advisory scan"}
          </button>
        </div>
        {heuristicError ? <p className="doc-workspace-alert">{heuristicError}</p> : null}
        {advisoryError ? <p className="doc-workspace-alert">{advisoryError}</p> : null}
        {advisoryReport?.sources?.length ? (
          <ul className="insights-scan-source-list">
            {advisoryReport.sources.map((source) => (
              <li key={`${source.source}-${source.message}`}>
                <strong>{source.source}:</strong> {source.state} · {source.message}
                {typeof source.durationMs === "number" ? ` (${source.durationMs}ms)` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <RiskSection
        title="Vulnerabilities & CVEs"
        subtitle="Advisory findings from dependency scanners and vulnerability feeds."
        items={groups.vulnerabilities}
        onJumpToCompare={onJumpToCompare}
      />
      <RiskSection
        title="Dependency & config security"
        subtitle="Changes in manifests, lockfiles, auth/config surfaces, and build pipelines."
        items={groups.dependenciesConfig}
        onJumpToCompare={onJumpToCompare}
      />
      <RiskSection
        title="Memory leak checks"
        subtitle="Heuristics for event/timer cleanup issues and unsafe long-lived allocations."
        items={groups.memoryLeaks}
        onJumpToCompare={onJumpToCompare}
      />
      <RiskSection
        title="Function completeness checks"
        subtitle="Heuristics for incomplete implementations, stubs, and unverified API surface changes."
        items={groups.functionCompleteness}
        onJumpToCompare={onJumpToCompare}
      />
      {groups.others.length > 0 ? (
        <RiskSection
          title="Other security-relevant findings"
          subtitle="Additional findings that do not fit the primary categories."
          items={groups.others}
          onJumpToCompare={onJumpToCompare}
        />
      ) : null}
    </main>
  );
}
