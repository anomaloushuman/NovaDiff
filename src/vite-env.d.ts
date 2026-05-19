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
import type {
  GitRepoStatus,
  GitToolingStatus,
  GithubPullRequestSummary,
  GithubRepoSummary,
  LocalRepoMatch,
  PrCompareRoots,
  PublishExecutePayload,
  PublishExecuteResult,
  PublishPreview,
} from "./app/gitTypes";

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
  buildKnowledgeGraph?: (payload: {
    projectRoot: string;
    side?: "baseline" | "target" | "both";
    leftTitle?: string;
    rightTitle?: string;
    changes?: FileChange[];
  }) => Promise<{
    ok: boolean;
    projectRoot: string;
    graphPath: string;
    nodeCount: number;
    edgeCount: number;
    fileCount: number;
    hasDiffOverlay: boolean;
  }>;
  readKnowledgeGraph?: (payload: { projectRoot: string }) => Promise<{
    ok: boolean;
    ready?: boolean;
    reason?: string;
    projectRoot: string;
    graph?: unknown;
    diffOverlay?: {
      changedNodeIds: string[];
      affectedNodeIds: string[];
    } | null;
  }>;
  readKnowledgeGraphFile?: (payload: {
    projectRoot: string;
    relativePath: string;
  }) => Promise<{
    path: string;
    language: string;
    content: string;
    sizeBytes: number;
    lineCount: number;
  }>;
  onKnowledgeGraphProgress?: (
    cb: (msg: {
      message?: string;
      phase?: string;
      current?: number;
      total?: number;
    }) => void,
  ) => () => void;
  onSummaryPrefetchProgress: (
    cb: (msg: Record<string, unknown>) => void,
  ) => () => void;
  onEngineProgress: (
    cb: (msg: Record<string, unknown>) => void,
  ) => () => void;
  llmSummarize: (payload: LlmSummarizePayload) => Promise<string>;
  llmSummarizeStream: (
    payload: LlmSummarizePayload,
    onChunk: (accumulatedText: string) => void,
  ) => Promise<void>;
  llmAbortStream: () => Promise<void>;
  llmProbe: (payload: LlmSettings) => Promise<{ ok: boolean; reply?: string }>;
  gitDetectTooling?: () => Promise<GitToolingStatus>;
  gitRepoStatus?: (payload: { repoRoot: string }) => Promise<GitRepoStatus>;
  gitDiscoverRepos?: (payload?: {
    owner?: string;
    repo?: string;
    extraRoots?: string[];
  }) => Promise<{ searchRoots: string[]; matches: LocalRepoMatch[]; scannedAt: string }>;
  gitMatchLocalRepo?: (payload: {
    owner: string;
    repo: string;
    extraRoots?: string[];
  }) => Promise<LocalRepoMatch[]>;
  githubListRepos?: (payload?: { limit?: number }) => Promise<GithubRepoSummary[]>;
  githubListPrs?: (payload: {
    repository: string;
    state?: string;
    limit?: number;
  }) => Promise<GithubPullRequestSummary[]>;
  githubPrCompareRoots?: (payload: {
    repoRoot: string;
    baseRef?: string;
    headRef?: string;
  }) => Promise<PrCompareRoots>;
  githubPrView?: (payload: {
    repository: string;
    number: number;
  }) => Promise<Record<string, unknown>>;
  gitPublishPreview?: (payload: { repoRoot: string }) => Promise<PublishPreview>;
  gitPublishExecute?: (payload: PublishExecutePayload) => Promise<PublishExecuteResult>;
  workspaceSessionLoad?: () => Promise<import("./app/workspaceTypes").WorkspaceSessionState>;
  workspaceSetGitUser?: (
    user: import("./app/workspaceTypes").GitUserProfile,
  ) => Promise<import("./app/workspaceTypes").WorkspaceSessionState>;
  workspaceCreate?: (payload: {
    name?: string;
    repoRoot?: string;
    cloneUrl?: string;
    githubSlug?: string;
  }) => Promise<
    | import("./app/workspaceTypes").NovaWorkspace
    | {
        workspace: import("./app/workspaceTypes").NovaWorkspace;
        session: import("./app/workspaceTypes").WorkspaceSessionState;
      }
  >;
  workspaceSetActive?: (payload: {
    workspaceId: string;
  }) => Promise<import("./app/workspaceTypes").WorkspaceSessionState>;
  workspaceList?: () => Promise<import("./app/workspaceTypes").NovaWorkspace[]>;
  workspaceMatchLocal?: (payload: {
    owner: string;
    repo: string;
    extraRoots?: string[];
  }) => Promise<LocalRepoMatch[]>;
  workspaceIndexHistory?: (payload: {
    workspaceId: string;
  }) => Promise<import("./app/workspaceTypes").NovaWorkspace>;
  workspaceUpdateLiveRepo?: (payload: {
    workspaceId: string;
    liveDevRepoRoot: string;
  }) => Promise<import("./app/workspaceTypes").WorkspaceSessionState>;
  gitBlameAtRef?: (payload: {
    repoRoot: string;
    ref: string;
    relPath: string;
  }) => Promise<import("./app/gitTypes").GitBlameAtRefResult>;
  workspaceEnsureCommitSnapshot?: (payload: {
    workspaceId: string;
    hash: string;
    snapshotPath: string;
  }) => Promise<{ snapshotPath: string; ready: boolean }>;
  workspaceSnapshotListFiles?: (payload: {
    snapshotPath: string;
    maxFiles?: number;
  }) => Promise<{ files: string[] }>;
  workspaceSnapshotReadFile?: (payload: {
    snapshotPath: string;
    relPath: string;
  }) => Promise<{ content: string; truncated: boolean; size: number }>;
  githubGhStatus?: () => Promise<import("./app/workspaceTypes").GhToolingStatus>;
  githubGhInstall?: () => Promise<{ ok: boolean; path?: string; version?: string | null }>;
  onGithubGhInstallProgress?: (cb: (msg: { line?: string }) => void) => () => void;
  workspaceSetLocalOnly?: (payload: {
    enabled: boolean;
  }) => Promise<import("./app/workspaceTypes").WorkspaceSessionState>;
  githubDetectedUsers?: () => Promise<import("./app/workspaceTypes").GitUserProfile[]>;
  githubUserProfile?: () => Promise<import("./app/workspaceTypes").GitUserProfile>;
  githubStartAuth?: () => Promise<{
    ok: boolean;
    userCode?: string;
    verificationUri?: string;
  }>;
  githubCancelAuth?: () => Promise<{ ok: boolean }>;
  onGithubAuthProgress?: (
    cb: (msg: {
      phase: "code" | "complete" | "error";
      userCode?: string;
      verificationUri?: string;
      message?: string;
    }) => void,
  ) => () => void;
  onWorkspaceHistoryProgress?: (
    cb: (msg: {
      workspaceId?: string;
      current?: number;
      total?: number;
      message?: string;
      hash?: string;
      done?: boolean;
    }) => void,
  ) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
