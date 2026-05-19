export interface GitUserProfile {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  hostname: string;
  authenticatedAt: string;
}

export interface WorkspaceCommitSnapshot {
  hash: string;
  shortHash: string;
  subject: string;
  authoredAt: string;
  snapshotPath: string;
  docsPath: string | null;
  indexedAt: string | null;
}

export interface NovaWorkspace {
  id: string;
  name: string;
  repoRoot: string;
  githubSlug: string | null;
  dataDir: string;
  createdAt: string;
  updatedAt: string;
  historyStatus: "idle" | "indexing" | "ready" | "error";
  historyError: string | null;
  historyProgress: { current: number; total: number; message: string } | null;
  commits: WorkspaceCommitSnapshot[];
  /** Local checkout used for live dev vs indexed commit compare */
  liveDevRepoRoot?: string | null;
}

export interface GitHistoryCompareOptions {
  useLiveHead?: boolean;
  liveRepoRoot?: string;
}

export interface GhToolingStatus {
  installed: boolean;
  path: string | null;
  version: string | null;
  canAutoInstall: boolean;
  installMethod: string | null;
  installCommand: string | null;
  installLabel: string | null;
  manualUrl: string;
  manualHint: string | null;
  reason: string;
}

export interface WorkspaceSessionState {
  gitUser: GitUserProfile | null;
  activeWorkspaceId: string | null;
  workspaces: NovaWorkspace[];
  localOnlyMode: boolean;
}
