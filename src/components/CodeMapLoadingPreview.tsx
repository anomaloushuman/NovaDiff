import { useMemo } from "react";
import { useBackgroundActivity } from "../app/BackgroundActivityContext";
import type { CodeMapLoadSnapshot } from "../app/codeMapLoadProgress";
import "./CodeMapLoadingPreview.css";

export interface CodeMapLoadingPreviewProps {
  snapshot: CodeMapLoadSnapshot;
  exiting?: boolean;
}

type StatusRow = {
  key: string;
  label: string;
  detail: string | null;
  percent: number | null;
};

export function CodeMapLoadingPreview({ snapshot, exiting = false }: CodeMapLoadingPreviewProps) {
  const { activities } = useBackgroundActivity();

  const rows = useMemo(() => {
    const list: StatusRow[] = [
      {
        key: "code-map",
        label: snapshot.phase,
        detail: snapshot.detail,
        percent: snapshot.percent,
      },
    ];

    const seen = new Set<string>();
    for (const activity of activities) {
      const label = activity.label.trim();
      if (!label || seen.has(label)) {
        continue;
      }
      if (label.toLowerCase() === snapshot.phase.toLowerCase()) {
        continue;
      }
      seen.add(label);
      list.push({
        key: activity.id,
        label,
        detail: activity.detail ?? null,
        percent: activity.progress,
      });
    }

    return list.slice(0, 3);
  }, [activities, snapshot.detail, snapshot.percent, snapshot.phase]);

  const primaryPct = Math.min(100, Math.max(2, snapshot.percent));

  return (
    <div
      className={`code-map-loading-preview${exiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy={!exiting}
      data-code-map-loader=""
    >
      <div className="code-map-loading-preview__viewport" aria-hidden>
        <div className="code-map-loading-preview__stars" />
        <div className="code-map-loading-preview__horizon" />
        <div className="code-map-loading-preview__mesh" />
        <div
          className="code-map-loading-preview__beam"
          style={{ width: `${primaryPct}%` }}
        />
      </div>

      <div className="code-map-loading-preview__console">
        <p className="code-map-loading-preview__title">Preparing code map</p>
        <div className="code-map-loading-preview__tracks">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className={`code-map-loading-preview__track${index === 0 ? " is-primary" : ""}`}
            >
              <div className="code-map-loading-preview__track-head">
                <span className="code-map-loading-preview__track-label">{row.label}</span>
                {row.percent != null ? (
                  <span className="code-map-loading-preview__track-pct">
                    {Math.round(row.percent)}%
                  </span>
                ) : null}
              </div>
              <div
                className={`code-map-loading-preview__track-bar${
                  row.percent == null ? " is-indeterminate" : ""
                }`}
              >
                <div
                  className="code-map-loading-preview__track-fill"
                  style={
                    row.percent != null ? { width: `${Math.round(row.percent)}%` } : undefined
                  }
                />
              </div>
              {row.detail ? (
                <p className="code-map-loading-preview__track-detail">{row.detail}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
