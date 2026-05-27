export interface CodeCityChromeInsets {
  bottom: number;
  right: number;
  left: number;
  hidden: boolean;
}

const BASE_INSET = 10;

function rectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function liftForObstruction(hostRect: DOMRect, obstruction: DOMRect, bottom: number): number {
  if (!rectsOverlap(hostRect, obstruction)) {
    return bottom;
  }
  if (obstruction.top >= hostRect.bottom) {
    return bottom;
  }
  return Math.max(bottom, hostRect.bottom - obstruction.top + BASE_INSET);
}

function isCodeViewerOpen(): boolean {
  return Boolean(
    document.querySelector(
      "[data-novadiff-code-viewer-sheet], [data-novadiff-code-viewer-modal]",
    ),
  );
}

function isBlockingModalOpen(): boolean {
  return (
    isCodeViewerOpen() ||
    Boolean(
      document.querySelector(
        [
          ".docs-explore-modal-backdrop.is-open",
          ".docs-explore-modal-backdrop.ui-overlay.is-open",
          ".code-city-explore-cover-backdrop.is-open",
          ".code-city-explore-cover-backdrop.ui-overlay.is-open",
          ".novadiff-explain-modal-backdrop",
          ".novadiff-graph-shell.is-fullscreen .ui-overlay.is-open",
        ].join(","),
      ),
    )
  );
}

export interface MeasureCodeCityChromeOptions {
  /** Docked in the react-flow bottom-left controls panel (no sidebar offsets). */
  dockedControls?: boolean;
}

/**
 * Insets for code city. When docked beside zoom controls, only lifts for bottom
 * sheet / activity bar — never the right-hand inspector sidebar.
 */
export function measureCodeCityChromeInsets(
  host: HTMLElement,
  options: MeasureCodeCityChromeOptions = {},
): CodeCityChromeInsets {
  const { dockedControls = false } = options;
  if (isBlockingModalOpen()) {
    return { bottom: BASE_INSET, right: BASE_INSET, left: BASE_INSET, hidden: true };
  }

  const hostRect = host.getBoundingClientRect();
  let bottom = dockedControls ? 0 : BASE_INSET;
  const right = BASE_INSET;
  const left = BASE_INSET;

  const obstructions: Element[] = [];

  if (!isCodeViewerOpen()) {
    const layoutRow =
      host.closest("[data-novadiff-graph-layout-row]") ??
      host.closest(".novadiff-graph-embed")?.querySelector("[data-novadiff-graph-layout-row]");
    if (layoutRow instanceof HTMLElement) {
      const sheet = layoutRow.querySelector("[data-novadiff-code-viewer-sheet]");
      if (sheet) {
        obstructions.push(sheet);
      }
    }
  }

  const activityBar = document.querySelector(".background-activity-bar");
  if (activityBar) {
    obstructions.push(activityBar);
  }

  for (const el of obstructions) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      continue;
    }
    bottom = liftForObstruction(hostRect, rect, bottom);
  }

  const maxBottom = Math.max(BASE_INSET, hostRect.height - 120);
  bottom = Math.min(bottom, maxBottom);

  return { bottom, right, left, hidden: false };
}
