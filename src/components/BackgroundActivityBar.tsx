import { useEffect, useState } from "react";
import { useBackgroundActivity } from "../app/BackgroundActivityContext";
import { usePrefersReducedMotion } from "../app/usePrefersReducedMotion";

function formatElapsed(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) {
    return `${sec}s`;
  }
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

export function BackgroundActivityBar() {
  const { activities } = useBackgroundActivity();
  const reduced = usePrefersReducedMotion();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (activities.length === 0) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [activities.length]);

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="background-activity-bar" role="status" aria-live="polite" aria-atomic="false">
      <div className="background-activity-bar-inner">
        {activities.map((activity) => {
          const elapsed = formatElapsed(now - activity.startedAt);
          const pct =
            activity.progress != null
              ? Math.min(100, Math.max(0, Math.round(activity.progress)))
              : null;
          return (
            <div key={activity.id} className="background-activity-item doc-state-enter">
              <div className="background-activity-item-head">
                <span className={`background-activity-pulse${reduced ? "" : " is-animated"}`} />
                <div className="background-activity-item-text">
                  <strong>{activity.label}</strong>
                  {activity.detail ? (
                    <span className="background-activity-detail">{activity.detail}</span>
                  ) : null}
                </div>
                <span className="background-activity-elapsed">{elapsed}</span>
              </div>
              <div
                className={`background-activity-track${pct == null ? " is-indeterminate" : ""}`}
                aria-hidden
              >
                <div
                  className="background-activity-fill"
                  style={pct != null ? { width: `${pct}%` } : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
