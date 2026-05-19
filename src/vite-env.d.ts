/// <reference types="vite/client" />

import type {
  CodeCityModel,
  CodebaseOutline,
  EvidenceBadge,
  FileSummaryEvidence,
  FileChange,
  FileDiffPayload,
  NovadiffDocsPage,
  NovadiffDocsBundleKey,
  RiskSignal,
  SelectionIndexEntry,
  SelectionDocArtifactMeta,
  SummaryIndexEntry,
} from "./app/types";
import type {
  LlmSettings,
  LlmSummarizePayload,
} from "./app/llmStorage";

export interface SummaryPrefetchPayload {
  leftRoot: string;
  rightRoot: string;
  leftLabel: string;
  rightLabel: string;
  changes: FileChange[];
  llmSettings: LlmSettings;
  limit?: number;
}

export interface FileSummaryExportPayload {
  targetRoot: string;
  relPath: string;
  kind: string;
  leftTitle?: string;
  rightTitle?: string;
  generatedAt?: string;
  markdown: string;
  summaryEvidence?: FileSummaryEvidence;
}

export interface FileSummaryMarkdownReadPayload {
  targetRoot: string;
  relPaths: string[];
}

export interface SelectionSummaryExportPayload extends SelectionDocArtifactMeta {
  targetRoot: string;
  leftTitle?: string;
  rightTitle?: string;
  generatedAt?: string;
  markdown: string;
}

export interface SelectionSummaryMarkdownReadPayload {
  targetRoot: string;
  relPaths: string[];
}

export interface NovadiffDocsWritePayload {
  targetRoot: string;
  bundleKey?: NovadiffDocsBundleKey;
  docMode?: NovadiffDocsBundleKey;
  leftRoot?: string;
  rightRoot?: string;
  leftTitle?: string;
  rightTitle?: string;
  generatedAt?: string;
  aiMarkdown?: string;
  compareMetricsMd?: string;
  codebaseOutline?: CodebaseOutline | Record<string, unknown>;
  changeMixMermaid?: string;
  depthMermaid?: string;
  importGraphMermaid?: string;
  crossFileCallGraphMermaid?: string;
  classDiagramMermaid?: string;
  riskSignals?: RiskSignal[];
  summaryIndex?: SummaryIndexEntry[];
  selectionIndex?: SelectionIndexEntry[];
  releaseOverviewMd?: string;
  confidenceBadges?: EvidenceBadge[];
}

export interface NovadiffDocsReadPayload {
  targetRoot: string;
  bundleKey?: NovadiffDocsBundleKey;
  relPath: NovadiffDocsPage;
  /** When true, main injects `<base href="file://…/novadiff-docs/">` for iframe preview. */
  forPreview?: boolean;
}

export interface ElectronAPI {
  compareFolders: (left: string, right: string) => Promise<FileChange[]>;
  getFileDiff: (
    leftRoot: string,
    rightRoot: string,
    relPath: string,
    kind: string,
  ) => Promise<FileDiffPayload>;
  pickDirectory: () => Promise<string | null>;
  toggleFullscreen: () => Promise<void>;
  getWindowState?: () => Promise<{
    platform: string;
    isMaximized: boolean;
    isFullScreen: boolean;
  }>;
  minimizeWindow?: () => Promise<void>;
  toggleMaximizeWindow?: () => Promise<{
    platform: string;
    isMaximized: boolean;
    isFullScreen: boolean;
  }>;
  closeWindow?: () => Promise<void>;
  onWindowStateChanged?: (
    cb: (msg: {
      platform: string;
      isMaximized: boolean;
      isFullScreen: boolean;
    }) => void,
  ) => () => void;
  startSummaryPrefetch: (
    payload: SummaryPrefetchPayload,
  ) => Promise<{ ok?: boolean }>;
  stopSummaryPrefetch: () => Promise<{ ok?: boolean }>;
  getPrefetchedSummary: (relPath: string) => Promise<string | null>;
  saveFileSummaryArtifacts?: (
    payload: FileSummaryExportPayload,
  ) => Promise<{
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    markdownPath?: string;
    htmlPath?: string;
    pdfPath?: string;
    pdfWarning?: string | null;
  }>;
  readFileSummaryMarkdowns?: (
    payload: FileSummaryMarkdownReadPayload,
  ) => Promise<Array<SummaryIndexEntry>>;
  saveSelectionSummaryArtifacts?: (
    payload: SelectionSummaryExportPayload,
  ) => Promise<{
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    markdownPath?: string;
    htmlPath?: string;
    pdfPath?: string;
    pdfWarning?: string | null;
  }>;
  readSelectionSummaryMarkdowns?: (
    payload: SelectionSummaryMarkdownReadPayload,
  ) => Promise<Array<SelectionIndexEntry>>;
  filterChangesGitignore: (payload: {
    changes: FileChange[];
    leftRoot: string;
    rightRoot: string;
  }) => Promise<{
    changes: FileChange[];
    skipped_gitignore: number;
    skipped_novadiff_docs?: number;
    input_changes: number;
    eligible_changes: number;
  }>;
  scanCodebaseOutline: (
    root: string,
  ) => Promise<CodebaseOutline | null>;
  scanRiskSignals?: (payload: {
    leftRoot: string;
    rightRoot: string;
    changes: FileChange[];
  }) => Promise<RiskSignal[]>;
  buildCodeCityModel?: (payload: {
    leftRoot: string;
    rightRoot: string;
    leftLabel: string;
    rightLabel: string;
    changes: FileChange[];
  }) => Promise<CodeCityModel | null>;
  writeNovadiffDocs: (
    payload: NovadiffDocsWritePayload,
  ) => Promise<{
    ok: boolean;
    dir: string;
    pdfWarning?: string | null;
    htmlWarning?: string | null;
  }>;
  readNovadiffDocsFile?: (
    payload: NovadiffDocsReadPayload,
  ) => Promise<string>;
  openNovadiffDocsInBrowser?: (payload: {
    targetRoot: string;
    bundleKey?: NovadiffDocsBundleKey;
  }) => Promise<void>;
  onSummaryPrefetchProgress: (
    cb: (msg: Record<string, unknown>) => void,
  ) => () => void;
  llmSummarize: (payload: LlmSummarizePayload) => Promise<string>;
  llmSummarizeStream: (
    payload: LlmSummarizePayload,
    onChunk: (accumulatedText: string) => void,
  ) => Promise<void>;
  llmAbortStream: () => Promise<void>;
  llmProbe: (payload: LlmSettings) => Promise<{ ok: boolean; reply?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
