"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const LLM_STREAM = "llm-stream-token";
const WINDOW_STATE = "window-state-changed";

contextBridge.exposeInMainWorld("electronAPI", {
  compareFolders: (left, right) =>
    ipcRenderer.invoke("compare-folders", left, right),
  getFileDiff: (leftRoot, rightRoot, relPath, kind) =>
    ipcRenderer.invoke("get-file-diff", leftRoot, rightRoot, relPath, kind),
  pickDirectory: () => ipcRenderer.invoke("pick-directory"),
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  getWindowState: () => ipcRenderer.invoke("window-state"),
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window-toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  onWindowStateChanged: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on(WINDOW_STATE, ch);
    return () => {
      ipcRenderer.removeListener(WINDOW_STATE, ch);
    };
  },
  startSummaryPrefetch: (payload) =>
    ipcRenderer.invoke("start-summary-prefetch", payload),
  stopSummaryPrefetch: () => ipcRenderer.invoke("stop-summary-prefetch"),
  getPrefetchedSummary: (relPath) =>
    ipcRenderer.invoke("get-prefetched-summary", relPath),
  saveFileSummaryArtifacts: (payload) =>
    ipcRenderer.invoke("save-file-summary-artifacts", payload),
  saveSelectionSummaryArtifacts: (payload) =>
    ipcRenderer.invoke("save-selection-summary-artifacts", payload),
  readFileSummaryMarkdowns: (payload) =>
    ipcRenderer.invoke("read-file-summary-markdowns", payload),
  readSelectionSummaryMarkdowns: (payload) =>
    ipcRenderer.invoke("read-selection-summary-markdowns", payload),
  filterChangesGitignore: (payload) =>
    ipcRenderer.invoke("filter-changes-gitignore", payload),
  scanCodebaseOutline: (root) => ipcRenderer.invoke("codebase-outline", root),
  scanRiskSignals: (payload) => ipcRenderer.invoke("risk-signals", payload),
  buildCodeCityModel: (payload) => ipcRenderer.invoke("build-code-city-model", payload),
  writeNovadiffDocs: (bundle) => ipcRenderer.invoke("write-novadiff-docs", bundle),
  readNovadiffDocsFile: (payload) =>
    ipcRenderer.invoke("read-novadiff-docs-file", payload),
  openNovadiffDocsInBrowser: (payload) =>
    ipcRenderer.invoke("open-novadiff-docs-in-browser", payload),
  buildKnowledgeGraph: (payload) => ipcRenderer.invoke("knowledge-graph-build", payload),
  readKnowledgeGraph: (payload) => ipcRenderer.invoke("knowledge-graph-read", payload),
  readKnowledgeGraphFile: (payload) =>
    ipcRenderer.invoke("knowledge-graph-read-file", payload),
  onKnowledgeGraphProgress: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on("knowledge-graph-progress", ch);
    return () => {
      ipcRenderer.removeListener("knowledge-graph-progress", ch);
    };
  },
  onEngineProgress: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on("engine-progress", ch);
    return () => {
      ipcRenderer.removeListener("engine-progress", ch);
    };
  },
  onSummaryPrefetchProgress: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on("summary-prefetch-progress", ch);
    return () => {
      ipcRenderer.removeListener("summary-prefetch-progress", ch);
    };
  },
  llmSummarize: (payload) => ipcRenderer.invoke("llm-summarize", payload),
  llmAbortStream: () => ipcRenderer.invoke("llm-abort-stream"),
  /**
   * Streams tokens; `onChunk` receives the full accumulated text each update.
   * Resolves when the stream completes; rejects on error or IPC failure.
   */
  llmSummarizeStream: async (payload, onChunk) => {
    await ipcRenderer.invoke("llm-abort-stream").catch(() => {});
    await Promise.resolve();
    return new Promise((resolve, reject) => {
      const handler = (_e, msg) => {
        if (!msg || typeof msg !== "object") {
          return;
        }
        if (msg.error) {
          ipcRenderer.removeListener(LLM_STREAM, handler);
          reject(new Error(msg.error));
          return;
        }
        if (msg.done) {
          ipcRenderer.removeListener(LLM_STREAM, handler);
          resolve(undefined);
          return;
        }
        if (typeof msg.text === "string") {
          onChunk(msg.text);
        }
      };
      ipcRenderer.on(LLM_STREAM, handler);
      ipcRenderer.invoke("llm-summarize-stream", payload).catch((err) => {
        ipcRenderer.removeListener(LLM_STREAM, handler);
        reject(err);
      });
    });
  },
  llmProbe: (payload) => ipcRenderer.invoke("llm-probe", payload),
  gitDetectTooling: () => ipcRenderer.invoke("git-detect-tooling"),
  gitRepoStatus: (payload) => ipcRenderer.invoke("git-repo-status", payload),
  gitDiscoverRepos: (payload) => ipcRenderer.invoke("git-discover-repos", payload),
  gitMatchLocalRepo: (payload) => ipcRenderer.invoke("git-match-local-repo", payload),
  githubListRepos: (payload) => ipcRenderer.invoke("github-list-repos", payload),
  githubListPrs: (payload) => ipcRenderer.invoke("github-list-prs", payload),
  githubPrCompareRoots: (payload) =>
    ipcRenderer.invoke("github-pr-compare-roots", payload),
  githubPrView: (payload) => ipcRenderer.invoke("github-pr-view", payload),
  gitPublishPreview: (payload) => ipcRenderer.invoke("git-publish-preview", payload),
  gitPublishExecute: (payload) => ipcRenderer.invoke("git-publish-execute", payload),
  gitStagePaths: (payload) => ipcRenderer.invoke("git-stage-paths", payload),
  gitStageDistrict: (payload) => ipcRenderer.invoke("git-stage-district", payload),
  exportProjectSnapshot: (payload) => ipcRenderer.invoke("export-project-snapshot", payload),
  workspaceSessionLoad: () => ipcRenderer.invoke("workspace-session-load"),
  workspaceSetGitUser: (user) => ipcRenderer.invoke("workspace-set-git-user", user),
  workspaceCreate: (payload) => ipcRenderer.invoke("workspace-create", payload),
  workspaceSetActive: (payload) => ipcRenderer.invoke("workspace-set-active", payload),
  workspaceList: () => ipcRenderer.invoke("workspace-list"),
  workspaceMatchLocal: (payload) => ipcRenderer.invoke("workspace-match-local", payload),
  workspaceIndexHistory: (payload) => ipcRenderer.invoke("workspace-index-history", payload),
  workspaceRefreshHistory: (payload) =>
    ipcRenderer.invoke("workspace-refresh-history", payload),
  workspaceUpdateLiveRepo: (payload) =>
    ipcRenderer.invoke("workspace-update-live-repo", payload),
  workspaceUpdateUiState: (payload) =>
    ipcRenderer.invoke("workspace-update-ui-state", payload),
  gitBlameAtRef: (payload) => ipcRenderer.invoke("git-blame-at-ref", payload),
  gitCommitDetail: (payload) => ipcRenderer.invoke("git-commit-detail", payload),
  githubCommitContext: (payload) => ipcRenderer.invoke("github-commit-context", payload),
  workspaceEnsureCommitSnapshot: (payload) =>
    ipcRenderer.invoke("workspace-ensure-commit-snapshot", payload),
  workspaceSnapshotListFiles: (payload) =>
    ipcRenderer.invoke("workspace-snapshot-list-files", payload),
  workspaceSnapshotReadFile: (payload) =>
    ipcRenderer.invoke("workspace-snapshot-read-file", payload),
  githubGhStatus: () => ipcRenderer.invoke("github-gh-status"),
  githubGhInstall: () => ipcRenderer.invoke("github-gh-install"),
  onGithubGhInstallProgress: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on("github-gh-install-progress", ch);
    return () => {
      ipcRenderer.removeListener("github-gh-install-progress", ch);
    };
  },
  workspaceSetLocalOnly: (payload) => ipcRenderer.invoke("workspace-set-local-only", payload),
  githubDetectedUsers: () => ipcRenderer.invoke("github-detected-users"),
  githubUserProfile: () => ipcRenderer.invoke("github-user-profile"),
  githubStartAuth: () => ipcRenderer.invoke("github-start-auth"),
  githubCancelAuth: () => ipcRenderer.invoke("github-cancel-auth"),
  onGithubAuthProgress: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on("github-auth-progress", ch);
    return () => {
      ipcRenderer.removeListener("github-auth-progress", ch);
    };
  },
  onWorkspaceHistoryProgress: (cb) => {
    const ch = (_e, msg) => {
      cb(msg);
    };
    ipcRenderer.on("workspace-history-progress", ch);
    return () => {
      ipcRenderer.removeListener("workspace-history-progress", ch);
    };
  },
});
