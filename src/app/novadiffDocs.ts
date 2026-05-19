import type { NovadiffDocsBundleKey } from "./types";

export const DOC_PREVIEW_PAGES = [
  "index.html",
  "narrative.html",
  "metrics.html",
  "diagrams.html",
  "release.html",
] as const;

export type DocPreviewPage = (typeof DOC_PREVIEW_PAGES)[number];

export const NOVADIFF_DOC_BUNDLES: NovadiffDocsBundleKey[] = [
  "change-report",
  "codebase-baseline",
  "codebase-target",
];

export function bundleLabel(bundleKey: NovadiffDocsBundleKey): string {
  switch (bundleKey) {
    case "codebase-baseline":
      return "Baseline codebase";
    case "codebase-target":
      return "Target codebase";
    default:
      return "Change report";
  }
}

export function bundleShortDescription(bundleKey: NovadiffDocsBundleKey): string {
  switch (bundleKey) {
    case "codebase-baseline":
      return "Full-codebase documentation for the baseline tree.";
    case "codebase-target":
      return "Full-codebase documentation for the target tree.";
    default:
      return "Diff-centric documentation for the current compare.";
  }
}
