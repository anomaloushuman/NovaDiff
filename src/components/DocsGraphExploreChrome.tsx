import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { AnimatedOverlay } from "./ui/AnimatedOverlay";
import { CodeCityGraphToolbar, DocsLinkToolbar } from "./DocumentationWorkspaceLinked";
import type { CodeCityLayoutResult } from "../app/codeCityLayout";

export interface GraphBuildBarProps {
  buildSide: "target" | "baseline";
  setBuildSide: (side: "target" | "baseline") => void;
  onRebuild: () => void;
  building: boolean;
  compared: boolean;
  stats: {
    nodeCount: number;
    edgeCount: number;
    fileCount: number;
    hasDiffOverlay: boolean;
  } | null;
  progressLabel?: string | null;
}

export interface CityExploreBarProps {
  cityLayout: CodeCityLayoutResult;
  cityRootSide: "baseline" | "target";
  setCityRootSide: (side: "baseline" | "target") => void;
  cityCompareOverlay: boolean;
  setCityCompareOverlay: Dispatch<SetStateAction<boolean>>;
  cityBlameOverlay: boolean;
  setCityBlameOverlay: Dispatch<SetStateAction<boolean>>;
  cityChangedOnly: boolean;
  setCityChangedOnly: Dispatch<SetStateAction<boolean>>;
  citySubsystem: string;
  setCitySubsystem: (v: string) => void;
  cityExtension: string;
  setCityExtension: (v: string) => void;
  citySymbolKind: string;
  setCitySymbolKind: (v: string) => void;
  cityAuthor: string;
  setCityAuthor: (v: string) => void;
  citySearch: string;
  setCitySearch: (v: string) => void;
  cityAuthors: string[];
  visibleBuildingCount: number;
  onResetFilters: () => void;
  inFileMode: boolean;
  enteredLabel: string | null;
  onExitBuilding: () => void;
}

function countActiveCityFilters(props: CityExploreBarProps): number {
  let n = 0;
  if (props.cityChangedOnly) {
    n += 1;
  }
  if (props.citySubsystem !== "all") {
    n += 1;
  }
  if (props.cityExtension !== "all") {
    n += 1;
  }
  if (props.citySymbolKind !== "all") {
    n += 1;
  }
  if (props.cityAuthor !== "all") {
    n += 1;
  }
  if (props.citySearch.trim()) {
    n += 1;
  }
  if (!props.cityCompareOverlay) {
    n += 1;
  }
  if (props.cityBlameOverlay) {
    n += 1;
  }
  return n;
}

function ExpandCornerIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className="code-city-expand-toggle-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
    >
      {expanded ? (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 20H4V10M4 20 20 4"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 4h6v6M10 14 20 4M5 9v11h11"
        />
      )}
    </svg>
  );
}

function CityFiltersPanel({ city }: { city: CityExploreBarProps }) {
  const filterCount = countActiveCityFilters(city);
  return (
    <section className="code-city-explore-section" aria-labelledby="code-city-explore-filters">
      <h3 id="code-city-explore-filters" className="code-city-explore-section-title">
        City filters
        {filterCount > 0 ? <span className="kg-action-badge">{filterCount}</span> : null}
      </h3>
      <div className="docs-explore-field">
        <span className="docs-explore-label">City root</span>
        <div className="code-city-segmented">
          <button
            type="button"
            className={
              city.cityRootSide === "baseline"
                ? "code-city-control-btn active"
                : "code-city-control-btn"
            }
            onClick={() => city.setCityRootSide("baseline")}
          >
            Baseline
          </button>
          <button
            type="button"
            className={
              city.cityRootSide === "target" ? "code-city-control-btn active" : "code-city-control-btn"
            }
            onClick={() => city.setCityRootSide("target")}
          >
            Target
          </button>
        </div>
      </div>
      <div className="docs-explore-field">
        <span className="docs-explore-label">Overlays</span>
        <div className="code-city-toggle-row">
          <button
            type="button"
            className={
              city.cityCompareOverlay ? "code-city-control-btn active" : "code-city-control-btn"
            }
            onClick={() => city.setCityCompareOverlay((v) => !v)}
          >
            Compare
          </button>
          <button
            type="button"
            className={
              city.cityBlameOverlay ? "code-city-control-btn active" : "code-city-control-btn"
            }
            onClick={() => city.setCityBlameOverlay((v) => !v)}
          >
            Blame
          </button>
          <button
            type="button"
            className={
              city.cityChangedOnly ? "code-city-control-btn active" : "code-city-control-btn"
            }
            onClick={() => city.setCityChangedOnly((v) => !v)}
          >
            Changed only
          </button>
        </div>
      </div>
      <div className="docs-explore-field-grid">
        <label className="docs-explore-label">
          Subsystem
          <select
            className="doc-workspace-select"
            value={city.citySubsystem}
            onChange={(e) => city.setCitySubsystem(e.target.value)}
          >
            <option value="all">All subsystems</option>
            {city.cityLayout.subsystems.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="docs-explore-label">
          Extension
          <select
            className="doc-workspace-select"
            value={city.cityExtension}
            onChange={(e) => city.setCityExtension(e.target.value)}
          >
            <option value="all">All extensions</option>
            {city.cityLayout.extensions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="docs-explore-label">
          Symbol kind
          <select
            className="doc-workspace-select"
            value={city.citySymbolKind}
            onChange={(e) => city.setCitySymbolKind(e.target.value)}
          >
            <option value="all">All symbol kinds</option>
            {city.cityLayout.symbolKinds.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="docs-explore-label">
          Author
          <select
            className="doc-workspace-select"
            value={city.cityAuthor}
            onChange={(e) => city.setCityAuthor(e.target.value)}
          >
            <option value="all">All authors</option>
            {city.cityAuthors.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="docs-explore-label">
        Search
        <input
          type="search"
          className="doc-workspace-search"
          placeholder="File or symbol"
          value={city.citySearch}
          onChange={(e) => city.setCitySearch(e.target.value)}
        />
      </label>
      <p className="doc-workspace-muted">
        {city.visibleBuildingCount} building{city.visibleBuildingCount === 1 ? "" : "s"} visible
      </p>
      <button type="button" className="doc-workspace-copy-btn" onClick={city.onResetFilters}>
        Reset all filters
      </button>
    </section>
  );
}

function CityLinkPanel({ city }: { city: CityExploreBarProps }) {
  return (
    <section className="code-city-explore-section" aria-labelledby="code-city-explore-linking">
      <h3 id="code-city-explore-linking" className="code-city-explore-section-title">
        City ↔ graph linking
      </h3>
      <DocsLinkToolbar />
      <CodeCityGraphToolbar
        inFileMode={city.inFileMode}
        enteredLabel={city.enteredLabel}
        onExit={city.onExitBuilding}
      />
      <p className="doc-workspace-muted">
        Click a building to highlight its symbol. Double-click to enter the file layer on the graph.
        Use Exit file or the breadcrumb when inside a file.
      </p>
    </section>
  );
}

function GraphBuildPanel({ graph }: { graph: GraphBuildBarProps }) {
  return (
    <section className="code-city-explore-section" aria-labelledby="code-city-explore-graph">
      <h3 id="code-city-explore-graph" className="code-city-explore-section-title">
        Knowledge graph
      </h3>
      <div className="docs-explore-field">
        <span className="docs-explore-label">Build from</span>
        <div className="code-city-segmented">
          <button
            type="button"
            className={
              graph.buildSide === "target" ? "code-city-control-btn active" : "code-city-control-btn"
            }
            disabled={graph.building}
            onClick={() => graph.setBuildSide("target")}
          >
            Target tree
          </button>
          <button
            type="button"
            className={
              graph.buildSide === "baseline"
                ? "code-city-control-btn active"
                : "code-city-control-btn"
            }
            disabled={graph.building}
            onClick={() => graph.setBuildSide("baseline")}
          >
            Baseline tree
          </button>
        </div>
      </div>
      <button
        type="button"
        className="doc-workspace-copy-btn"
        disabled={graph.building}
        onClick={graph.onRebuild}
      >
        {graph.building ? "Rebuilding…" : "Rebuild graph"}
      </button>
      {graph.building ? (
        <p className="doc-workspace-muted" aria-live="polite">
          {graph.progressLabel ?? "Building graph…"}
        </p>
      ) : null}
      {!graph.compared ? (
        <p className="doc-workspace-muted">
          Run a folder comparison to enable diff highlighting on the target graph.
        </p>
      ) : null}
    </section>
  );
}

function GraphStatsPanel({ graph }: { graph: GraphBuildBarProps }) {
  return (
    <section className="code-city-explore-section" aria-labelledby="code-city-explore-stats">
      <h3 id="code-city-explore-stats" className="code-city-explore-section-title">
        Graph statistics
      </h3>
      {graph.stats ? (
        <div className="code-city-stat-grid">
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Nodes</span>
            <strong>{graph.stats.nodeCount.toLocaleString()}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Edges</span>
            <strong>{graph.stats.edgeCount.toLocaleString()}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Files</span>
            <strong>{graph.stats.fileCount.toLocaleString()}</strong>
          </div>
          <div className="code-city-stat-card">
            <span className="code-city-stat-label">Diff overlay</span>
            <strong>{graph.stats.hasDiffOverlay ? "On" : "Off"}</strong>
          </div>
        </div>
      ) : (
        <p className="doc-workspace-muted">Build the graph to see statistics.</p>
      )}
    </section>
  );
}

function CodeCityFloatShell({
  shellRef,
  expanded,
  settingsActive,
  filterCount,
  city,
  graph,
  children,
  onToggleExpand,
}: {
  shellRef: RefObject<HTMLDivElement | null>;
  expanded: boolean;
  settingsActive: boolean;
  filterCount: number;
  city: CityExploreBarProps;
  graph: GraphBuildBarProps;
  children: ReactNode;
  onToggleExpand: () => void;
}) {
  return (
    <div
      ref={shellRef}
      className={`code-city-float code-city-float--chrome${expanded ? " code-city-float--expanded" : " code-city-float--docked"}`}
      aria-label="Code city"
    >
      <div className="code-city-float-viewport">
        {children}
        <button
          type="button"
          className={`code-city-expand-toggle${settingsActive ? " code-city-expand-toggle--active" : ""}${expanded ? " code-city-expand-toggle--expanded" : ""}`}
          aria-label={expanded ? "Collapse code city settings" : "Expand code city settings"}
          aria-expanded={expanded}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          <ExpandCornerIcon expanded={expanded} />
          {filterCount > 0 && !expanded ? (
            <span className="code-city-settings-badge">{filterCount}</span>
          ) : null}
        </button>
      </div>
      {expanded ? (
        <div className="code-city-explore-settings-panel">
          {city.inFileMode ? (
            <button
              type="button"
              className="doc-workspace-copy-btn code-city-explore-exit-file"
              onClick={city.onExitBuilding}
            >
              Exit file layer
            </button>
          ) : null}
          <CityFiltersPanel city={city} />
          <CityLinkPanel city={city} />
          <GraphBuildPanel graph={graph} />
          {graph.stats ? <GraphStatsPanel graph={graph} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Code city shell stays on document.body (one React tree). The minimap slot holds a measure anchor only.
 */
export function CodeCityExploreSettings({
  city,
  graph,
  children,
}: {
  city: CityExploreBarProps;
  graph: GraphBuildBarProps;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [bodyMount, setBodyMount] = useState<HTMLElement | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const filterCount = useMemo(() => countActiveCityFilters(city), [city]);
  const settingsActive = filterCount > 0 || city.inFileMode || graph.building;

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "code-city-body-mount";
    document.body.appendChild(el);
    setBodyMount(el);
    return () => {
      el.remove();
      setBodyMount(null);
    };
  }, []);

  useEffect(() => {
    if (!bodyMount) {
      return;
    }
    bodyMount.toggleAttribute("data-code-city-expanded", expanded);
  }, [expanded, bodyMount]);

  const syncDockedPosition = useCallback(() => {
    const anchor = anchorRef.current;
    const shell = shellRef.current;
    if (!anchor || !shell || expanded) {
      return;
    }
    const slot = anchor.closest("[data-code-city-minimap]");
    if (
      !(slot instanceof HTMLElement) ||
      slot.classList.contains("code-city-minimap-slot--chrome-hidden")
    ) {
      shell.style.visibility = "hidden";
      shell.style.pointerEvents = "none";
      return;
    }

    const rect = anchor.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      shell.style.visibility = "hidden";
      shell.style.pointerEvents = "none";
      return;
    }

    const lift = getComputedStyle(slot).getPropertyValue("--code-city-lift").trim() || "0px";
    shell.style.setProperty("--code-city-dock-left", `${rect.left}px`);
    shell.style.setProperty("--code-city-dock-top", `${rect.top}px`);
    shell.style.setProperty("--code-city-dock-width", `${rect.width}px`);
    shell.style.setProperty("--code-city-dock-height", `${rect.height}px`);
    shell.style.setProperty("--code-city-lift", lift);
    shell.style.visibility = "visible";
    shell.style.pointerEvents = "auto";
  }, [expanded]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    document
      .querySelector("[data-code-city-minimap]")
      ?.toggleAttribute("data-code-city-expanded", expanded);

    if (expanded) {
      shell.style.removeProperty("--code-city-dock-left");
      shell.style.removeProperty("--code-city-dock-top");
      shell.style.removeProperty("--code-city-dock-width");
      shell.style.removeProperty("--code-city-dock-height");
      shell.style.removeProperty("--code-city-lift");
      shell.style.visibility = "visible";
      shell.style.pointerEvents = "auto";
    } else {
      syncDockedPosition();
    }

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      innerRaf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [expanded, syncDockedPosition]);

  useLayoutEffect(() => {
    if (expanded) {
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    syncDockedPosition();
    const ro = new ResizeObserver(syncDockedPosition);
    ro.observe(anchor);
    const slot = anchor.closest("[data-code-city-minimap]");
    if (slot instanceof HTMLElement) {
      ro.observe(slot);
    }
    const cover = anchor.closest(".knowledge-graph-cover-stage");
    let mo: MutationObserver | null = null;
    if (cover instanceof HTMLElement) {
      ro.observe(cover);
      mo = new MutationObserver(syncDockedPosition);
      mo.observe(cover, {
        attributes: true,
        attributeFilter: ["class", "style"],
        subtree: true,
      });
    }
    const onDockReady = () => syncDockedPosition();
    window.addEventListener("code-city-dock-host-ready", onDockReady);
    window.addEventListener("resize", syncDockedPosition);
    window.addEventListener("scroll", syncDockedPosition, true);
    const intervalId = window.setInterval(syncDockedPosition, 200);
    return () => {
      ro.disconnect();
      mo?.disconnect();
      window.removeEventListener("code-city-dock-host-ready", onDockReady);
      window.removeEventListener("resize", syncDockedPosition);
      window.removeEventListener("scroll", syncDockedPosition, true);
      window.clearInterval(intervalId);
    };
  }, [expanded, syncDockedPosition]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const shell = (
    <CodeCityFloatShell
      shellRef={shellRef}
      expanded={expanded}
      settingsActive={settingsActive}
      filterCount={filterCount}
      city={city}
      graph={graph}
      onToggleExpand={() => setExpanded((v) => !v)}
    >
      {children}
    </CodeCityFloatShell>
  );

  const coverBackdrop =
    typeof document !== "undefined" && expanded
      ? createPortal(
          <AnimatedOverlay
            open={expanded}
            onClose={() => setExpanded(false)}
            backdropClassName="code-city-explore-cover-backdrop"
            panelClassName="code-city-explore-cover-panel"
            labelledBy="code-city-explore-cover-title"
          >
            <h2 id="code-city-explore-cover-title" className="visually-hidden">
              Code city settings
            </h2>
          </AnimatedOverlay>,
          document.body,
        )
      : null;

  return (
    <>
      <div ref={anchorRef} className="code-city-dock-anchor" data-code-city-dock-anchor aria-hidden />
      {bodyMount ? createPortal(shell, bodyMount) : null}
      {coverBackdrop}
    </>
  );
}

/** @deprecated Use CodeCityExploreSettings wrapping the code city minimap. */
export function DocsGraphActionBar(props: {
  city: CityExploreBarProps;
  graph: GraphBuildBarProps;
  children?: ReactNode;
}) {
  return <CodeCityExploreSettings {...props} />;
}
