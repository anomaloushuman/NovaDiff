export interface GitToolingStatus {
  git: {
    gitAvailable: boolean;
    gitVersion: string | null;
    gitError: string | null;
  };
  gh: GithubAuthStatus;
}

export interface GithubAuthStatus {
  available: boolean;
  loggedIn: boolean;
  user: string | null;
  hostname: string;
  scopes: string[];
  message: string;
}

export interface GithubRepoSummary {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  sshUrl: string;
  defaultBranch: string;
  isFork: boolean;
  updatedAt: string | null;
}

export interface GithubPullRequestSummary {
  number: number;
  title: string;
  state: string;
  url: string;
  headRef: string;
  baseRef: string;
  author: string;
  updatedAt: string | null;
  isDraft: boolean;
  repository: string;
}

export interface LocalRepoMatch {
  path: string;
  name: string;
  slug: string | null;
  remoteUrl: string | null;
}

export interface GitBlameOwner {
  author: string;
  lineCount: number;
  ratio: number;
}

export interface GitBlameAtRefResult {
  lineAuthors: string[];
  owners: GitBlameOwner[];
  ref: string;
  relPath: string;
  error: string | null;
}

export interface GitStatusFile {
  path: string;
  status: string;
  staged: boolean;
  unstaged: boolean;
}

export interface GitRepoStatus {
  repoRoot: string;
  branch: string;
  head: string;
  upstream: string;
  ahead: number;
  behind: number;
  dirty: boolean;
  files: GitStatusFile[];
  remotes: Array<{ name: string; url: string }>;
  subdir: string;
}

export interface PrCompareRoots {
  leftRoot: string;
  rightRoot: string;
  baseRef: string;
  headRef: string;
}

export interface PublishPreview {
  repoRoot: string;
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
  dirtyFiles: GitStatusFile[];
  remotes: Array<{ name: string; url: string }>;
  github: GithubAuthStatus;
  githubSlug: { owner: string; repo: string; host: string; remote?: string } | null;
  canPush: boolean;
}

export interface PublishExecuteResult {
  ok: boolean;
  commitHash: string;
  branch: string;
  pushed: boolean;
  pushRemote: string | null;
  prUrl: string | null;
}

export interface PublishExecutePayload {
  repoRoot: string;
  subject: string;
  body: string;
  push?: boolean;
  createPullRequest?: boolean;
  remote?: string;
  branch?: string;
  prBody?: string;
  prBase?: string;
  prHead?: string;
  draftPr?: boolean;
  /** When set, only these paths are staged (instead of git add -A). */
  stagePaths?: string[];
}

export interface GitCommitDetail {
  hash: string;
  shortHash: string;
  subject: string;
  body: string;
  authorName: string;
  authorEmail: string;
  authoredAt: string;
  parentHashes: string[];
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface GithubCommitPullRequest {
  number: number;
  title: string;
  state: string;
  url: string;
}

export interface GithubCommitIssue {
  number: number;
  title: string;
  state: string;
  url: string;
}

export type GithubCommitThreadKind = "pr_review" | "pr_comment" | "issue_comment";

export interface GithubCommitThread {
  kind: GithubCommitThreadKind;
  number: number;
  author: string;
  body: string;
  createdAt: string | null;
  url: string | null;
}

export interface GithubCommitContext {
  pullRequests: GithubCommitPullRequest[];
  issues: GithubCommitIssue[];
  threads: GithubCommitThread[];
  error: string | null;
}
