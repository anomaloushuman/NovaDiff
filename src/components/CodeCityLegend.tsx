import type { CodeCityRenderableBuilding } from "../app/codeCityLayout";

export function CodeCityLegend({
  selected,
  blameOverlay,
  rootSide,
  visibleBuildingCount,
  districtCount,
  changedBuildingCount,
  onOpenDiff,
}: {
  selected: CodeCityRenderableBuilding | null;
  blameOverlay: boolean;
  rootSide: "baseline" | "target";
  visibleBuildingCount: number;
  districtCount: number;
  changedBuildingCount: number;
  onOpenDiff?: (path: string) => void;
}) {
  return (
    <aside className="code-city-legend">
      <div className="code-city-legend-card">
        <h3 className="doc-workspace-h3">Current view</h3>
        <div className="code-city-metric-grid">
          <div className="code-city-metric">
            <span className="code-city-metric-label">Root</span>
            <strong>{rootSide === "baseline" ? "Baseline" : "Target"}</strong>
          </div>
          <div className="code-city-metric">
            <span className="code-city-metric-label">Buildings</span>
            <strong>{visibleBuildingCount}</strong>
          </div>
          <div className="code-city-metric">
            <span className="code-city-metric-label">Districts</span>
            <strong>{districtCount}</strong>
          </div>
          <div className="code-city-metric">
            <span className="code-city-metric-label">Changed</span>
            <strong>{changedBuildingCount}</strong>
          </div>
        </div>
      </div>
      <div className="code-city-legend-card">
        <h3 className="doc-workspace-h3">Legend</h3>
        <ul className="code-city-legend-list">
          <li>
            <span className="code-city-swatch code-city-swatch--added" />
            Added / new
          </li>
          <li>
            <span className="code-city-swatch code-city-swatch--modified" />
            Modified
          </li>
          <li>
            <span className="code-city-swatch code-city-swatch--removed" />
            Removed / ghosted
          </li>
          <li>
            <span className="code-city-swatch code-city-swatch--kind" />
            Symbol kind color
          </li>
          <li>
            <span className="code-city-swatch code-city-swatch--author" />
            {blameOverlay ? "Author tint active" : "Enable blame overlay for author tint"}
          </li>
        </ul>
      </div>
      <div className="code-city-legend-card">
        <h3 className="doc-workspace-h3">Selected building</h3>
        {selected ? (
          <div className="code-city-selected">
            <div className="code-city-selected-head">
              <strong>{selected.name}</strong>
              <code>{selected.kind}</code>
            </div>
            <p className="code-city-selected-path">
              <code>{selected.path}</code>
            </p>
            <div className="code-city-selected-tags">
              <span className="code-city-selected-tag">{selected.rootSide}</span>
              <span className="code-city-selected-tag">{selected.changeState}</span>
              <span className="code-city-selected-tag">
                {selected.lineCount} line{selected.lineCount === 1 ? "" : "s"}
              </span>
              <span className="code-city-selected-tag">
                L{selected.startLine}-{selected.endLine}
              </span>
            </div>
            {onOpenDiff ? (
              <button
                type="button"
                className="doc-workspace-copy-btn"
                onClick={() => onOpenDiff(selected.path)}
              >
                Open diff
              </button>
            ) : null}
            {selected.dominantAuthor ? <p>Dominant author: {selected.dominantAuthor}</p> : null}
            {selected.owners.length > 0 ? (
              <ul className="code-city-owner-list">
                {selected.owners.slice(0, 4).map((owner) => (
                  <li key={`${selected.id}-${owner.author}`}>
                    {owner.author}: {Math.round(owner.ratio * 100)}%
                  </li>
                ))}
              </ul>
            ) : (
              <p className="doc-workspace-muted">
                No blame overlay data for this building yet.
              </p>
            )}
          </div>
        ) : (
          <p className="doc-workspace-muted">
            Click a building to inspect its symbol, path, change state, and blame data.
          </p>
        )}
      </div>
    </aside>
  );
}
