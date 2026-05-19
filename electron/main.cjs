"use strict";

const fs = require("node:fs/promises");
const fssync = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  nativeImage,
  shell,
} = require("electron");
const { runCompareEngine, runCompareEngineAsync } = require("./compare-runner.cjs");

function sendEngineProgress(webContents, payload) {
  if (webContents && !webContents.isDestroyed()) {
    webContents.send("engine-progress", payload);
  }
}
const { summarizeChange, summarizeChangeStream, probeProvider } = require("./llm.cjs");
const {
  startSummaryPrefetchWorker,
  stopSummaryPrefetchWorker,
  clearSummaryPrefetchCache,
  getPrefetchedSummary,
} = require("./prefetch-summaries.cjs");
const { writeNovadiffDocsBundle } = require("./novadiff-docs-writer.cjs");
const { generateNovadiffDocsPdf } = require("./novadiff-docs-pdf.cjs");
const {
  writeNovadiffDocsHtml,
  refreshNovadiffDocsHtmlFromDisk,
} = require("./novadiff-docs-html.cjs");
const {
  exportFileSummaryArtifacts,
  readFileSummaryMarkdowns,
  exportSelectionSummaryArtifacts,
  readSelectionSummaryMarkdowns,
} = require("./file-summary-export.cjs");
const { buildCodeCityModelPayload } = require("./code-city-model.cjs");
const { buildKnowledgeGraph } = require("./knowledge-graph-runner.cjs");
const {
  detectGitTooling,
  getRepoStatus,
  isGitRepo,
  preparePrCompareRoots,
  cleanupNovadiffWorktrees,
  parseGithubSlugFromUrl,
} = require("./git-service.cjs");
const {
  getAuthStatus,
  listRepos,
  listPullRequests,
  viewPullRequest,
  getUserProfile,
  listDetectedAccounts,
} = require("./github-service.cjs");
const { discoverRepos, matchRepoForGithubRepo } = require("./repo-discovery.cjs");
const { previewPublish, executePublish } = require("./git-publish.cjs");
const {
  loadSession,
  createWorkspace,
  setActiveWorkspace,
  setGitUser,
  setLocalOnlyMode,
  listWorkspaces,
  getWorkspace,
  updateWorkspaceLiveRepo,
  updateWorkspaceUiState,
  workspacesRoot,
} = require("./workspace-store.cjs");
const { blameFileAtRef } = require("./git-blame.cjs");
const { listSnapshotFiles, readSnapshotTextFile } = require("./workspace-files.cjs");
const {
  indexWorkspaceHistory,
  refreshWorkspaceHistory,
  ensureCommitSnapshot,
} = require("./workspace-history.cjs");
const {
  startGithubDeviceAuth,
  cancelGithubDeviceAuth,
} = require("./github-auth-flow.cjs");
const { spawn } = require("node:child_process");
const { augmentPathForCli } = require("./gh-path.cjs");
const { getGhToolingStatus, installGh } = require("./gh-install.cjs");

Object.assign(process.env, augmentPathForCli(process.env));

const ALLOWED_NOVADIFF_HTML = new Set([
  "index.html",
  "narrative.html",
  "metrics.html",
  "diagrams.html",
  "release.html",
]);
const DEFAULT_DOCS_BUNDLE_KEY = "change-report";

let mainWindow = null;

/** @type {Map<number, AbortController>} */
const llmStreamAbortByWebContentsId = new Map();

/**
 * @param {Electron.IpcMainInvokeEvent} [event]
 */
function getTargetWindow(event) {
  if (event?.sender) {
    return BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
  }
  return BrowserWindow.getFocusedWindow() ?? mainWindow;
}

/**
 * @param {Electron.BrowserWindow | null | undefined} win
 */
function windowStatePayload(win) {
  return {
    platform: process.platform,
    isMaximized: Boolean(win?.isMaximized()),
    isFullScreen: Boolean(win?.isFullScreen()),
  };
}

/**
 * @param {Electron.BrowserWindow | null | undefined} win
 */
function emitWindowState(win) {
  if (!win || win.isDestroyed()) {
    return;
  }
  win.webContents.send("window-state-changed", windowStatePayload(win));
}

function iconPath() {
  const png = path.join(__dirname, "..", "nova-diff-icon.png");
  if (require("node:fs").existsSync(png)) {
    return png;
  }
  return undefined;
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [{ role: "appMenu", label: app.name }]
      : [{ role: "fileMenu" }]),
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "reload", visible: !app.isPackaged },
        { role: "toggleDevTools", visible: !app.isPackaged },
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

function createWindow() {
  const icon = iconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: "#05070c",
    ...(icon ? { icon: nativeImage.createFromPath(icon) } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  ["maximize", "unmaximize", "enter-full-screen", "leave-full-screen"].forEach((evt) => {
    mainWindow?.on(evt, () => {
      emitWindowState(mainWindow);
    });
  });

  mainWindow.webContents.once("did-finish-load", () => {
    emitWindowState(mainWindow);
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://127.0.0.1:1420");
  } else {
    const indexHtml = path.join(__dirname, "..", "dist", "index.html");
    mainWindow.loadFile(indexHtml);
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildMenu());
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("compare-folders", async (event, left, right) => {
  try {
    return await runCompareEngineAsync(
      app.getAppPath(),
      {
        cmd: "compare-folders",
        left,
        right,
      },
      app.isPackaged,
      (progress) => sendEngineProgress(event.sender, progress),
    );
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle(
  "get-file-diff",
  (_evt, leftRoot, rightRoot, relPath, kind) => {
    try {
      return runCompareEngine(
        app.getAppPath(),
        {
          cmd: "get-file-diff",
          leftRoot,
          rightRoot,
          relPath,
          kind,
        },
        app.isPackaged,
      );
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  },
);

ipcMain.handle("pick-directory", async () => {
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
  const { canceled, filePaths } = await dialog.showOpenDialog(win ?? undefined, {
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }
  return filePaths[0];
});

ipcMain.handle("toggle-fullscreen", () => {
  const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
  if (!win) {
    return;
  }
  win.setFullScreen(!win.isFullScreen());
});

ipcMain.handle("window-state", (event) => {
  return windowStatePayload(getTargetWindow(event));
});

ipcMain.handle("window-minimize", (event) => {
  const win = getTargetWindow(event);
  win?.minimize();
});

ipcMain.handle("window-toggle-maximize", (event) => {
  const win = getTargetWindow(event);
  if (!win) {
    return windowStatePayload(null);
  }
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
  return windowStatePayload(win);
});

ipcMain.handle("window-close", (event) => {
  const win = getTargetWindow(event);
  win?.close();
});

ipcMain.handle("llm-summarize", async (_evt, payload) => {
  return await summarizeChange(payload);
});

ipcMain.handle("llm-summarize-stream", async (event, payload) => {
  const wc = event.sender;
  const id = wc.id;
  const prev = llmStreamAbortByWebContentsId.get(id);
  if (prev) {
    prev.abort();
  }
  const ac = new AbortController();
  llmStreamAbortByWebContentsId.set(id, ac);
  try {
    await summarizeChangeStream(payload, wc, ac.signal);
    wc.send("llm-stream-token", { done: true });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      wc.send("llm-stream-token", { done: true });
      return;
    }
    const msg = e instanceof Error ? e.message : String(e);
    wc.send("llm-stream-token", { error: msg });
    throw e;
  } finally {
    if (llmStreamAbortByWebContentsId.get(id) === ac) {
      llmStreamAbortByWebContentsId.delete(id);
    }
  }
});

ipcMain.handle("llm-abort-stream", (event) => {
  const id = event.sender.id;
  llmStreamAbortByWebContentsId.get(id)?.abort();
});

ipcMain.handle("llm-probe", async (_evt, payload) => {
  return await probeProvider(
    payload.provider,
    payload.baseUrl,
    payload.model,
  );
});

ipcMain.handle("start-summary-prefetch", (event, payload) => {
  const wc = event.sender;
  stopSummaryPrefetchWorker();
  clearSummaryPrefetchCache();
  void startSummaryPrefetchWorker({
    appRoot: app.getAppPath(),
    isPackaged: app.isPackaged,
    webContents: wc,
    leftRoot: payload.leftRoot,
    rightRoot: payload.rightRoot,
    leftLabel: payload.leftLabel,
    rightLabel: payload.rightLabel,
    changes: payload.changes,
    llmSettings: payload.llmSettings,
    limit: payload.limit,
  }).catch((err) => {
    wc.send("summary-prefetch-progress", {
      state: "fatal",
      message: err instanceof Error ? err.message : String(err),
    });
  });
  return { ok: true };
});

ipcMain.handle("stop-summary-prefetch", () => {
  stopSummaryPrefetchWorker();
  clearSummaryPrefetchCache();
  return { ok: true };
});

ipcMain.handle("get-prefetched-summary", (_evt, relPath) => {
  return getPrefetchedSummary(relPath) ?? null;
});

ipcMain.handle("save-file-summary-artifacts", async (_evt, payload) => {
  try {
    return await exportFileSummaryArtifacts(payload);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("read-file-summary-markdowns", async (_evt, payload) => {
  try {
    const relPaths = Array.isArray(payload?.relPaths) ? payload.relPaths : [];
    const diskItems = await readFileSummaryMarkdowns(payload);
    const byPath = new Map(diskItems.map((item) => [item.relPath, item]));
    for (const rawRel of relPaths) {
      const relPath = String(rawRel ?? "").trim();
      if (!relPath || byPath.has(relPath)) {
        continue;
      }
      const cached = getPrefetchedSummary(relPath);
      if (typeof cached === "string" && cached.trim()) {
        byPath.set(relPath, { relPath, markdown: cached });
      }
    }
    return relPaths
      .map((rawRel) => byPath.get(String(rawRel ?? "").trim()))
      .filter(Boolean);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("save-selection-summary-artifacts", async (_evt, payload) => {
  try {
    return await exportSelectionSummaryArtifacts(payload);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("read-selection-summary-markdowns", async (_evt, payload) => {
  try {
    return await readSelectionSummaryMarkdowns(payload);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("filter-changes-gitignore", async (event, payload) => {
  try {
    return await runCompareEngineAsync(
      app.getAppPath(),
      {
        cmd: "filter-changes-gitignore",
        changes: payload.changes,
        leftRoot: payload.leftRoot,
        rightRoot: payload.rightRoot,
      },
      app.isPackaged,
      (progress) => sendEngineProgress(event.sender, progress),
    );
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("codebase-outline", async (event, root) => {
  try {
    return await runCompareEngineAsync(
      app.getAppPath(),
      { cmd: "codebase-outline", root },
      app.isPackaged,
      (progress) => sendEngineProgress(event.sender, progress),
    );
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("risk-signals", async (event, payload) => {
  try {
    return await runCompareEngineAsync(
      app.getAppPath(),
      {
        cmd: "risk-signals",
        leftRoot: String(payload?.leftRoot ?? "").trim(),
        rightRoot: String(payload?.rightRoot ?? "").trim(),
        changes: Array.isArray(payload?.changes) ? payload.changes : [],
      },
      app.isPackaged,
      (progress) => sendEngineProgress(event.sender, progress),
    );
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("build-code-city-model", async (_evt, payload) => {
  try {
    return await buildCodeCityModelPayload({
      leftRoot: String(payload?.leftRoot ?? "").trim(),
      rightRoot: String(payload?.rightRoot ?? "").trim(),
      leftLabel: String(payload?.leftLabel ?? "").trim(),
      rightLabel: String(payload?.rightLabel ?? "").trim(),
      changes: Array.isArray(payload?.changes) ? payload.changes : [],
      loadOutline: async (root) =>
        runCompareEngine(
          app.getAppPath(),
          { cmd: "codebase-outline", root },
          app.isPackaged,
        ),
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("write-novadiff-docs", async (_evt, bundle) => {
  try {
    const out = await writeNovadiffDocsBundle(bundle);
    let pdfWarning = null;
    let htmlWarning = null;
    try {
      await writeNovadiffDocsHtml(bundle);
    } catch (e) {
      htmlWarning = e instanceof Error ? e.message : String(e);
    }
    try {
      await generateNovadiffDocsPdf(bundle, app.getAppPath());
    } catch (e) {
      pdfWarning = e instanceof Error ? e.message : String(e);
    }
    return { ...out, pdfWarning, htmlWarning };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("read-novadiff-docs-file", async (_evt, payload) => {
  const root = String(payload?.targetRoot ?? "").trim();
  const bundleKey = String(payload?.bundleKey ?? DEFAULT_DOCS_BUNDLE_KEY).trim();
  const rel = String(payload?.relPath ?? "").trim();
  const forPreview = Boolean(payload?.forPreview);
  if (!root || !bundleKey || !ALLOWED_NOVADIFF_HTML.has(rel)) {
    throw new Error("Invalid novadiff-docs read request");
  }
  const baseDir = path.resolve(path.join(root, "novadiff-docs", bundleKey));
  const abs = path.resolve(path.join(baseDir, rel));
  const relResolved = path.relative(baseDir, abs);
  if (
    relResolved !== rel ||
    relResolved.startsWith("..") ||
    path.isAbsolute(relResolved)
  ) {
    throw new Error("Invalid path");
  }
  try {
    await refreshNovadiffDocsHtmlFromDisk(root, bundleKey);
  } catch {
    // Fall back to any already-written HTML if regeneration is unavailable.
  }
  let content = await fs.readFile(abs, "utf8");
  if (forPreview && !content.includes("<base ")) {
    const href = pathToFileURL(baseDir).href;
    const baseHref = href.endsWith("/") ? href : `${href}/`;
    content = content.replace("<head>", `<head>\n  <base href="${baseHref}">`);
  }
  return content;
});

ipcMain.handle("open-novadiff-docs-in-browser", async (_evt, payload) => {
  const root = String(payload?.targetRoot ?? "").trim();
  const bundleKey = String(payload?.bundleKey ?? DEFAULT_DOCS_BUNDLE_KEY).trim();
  if (!root) {
    throw new Error("Missing targetRoot");
  }
  try {
    await refreshNovadiffDocsHtmlFromDisk(root, bundleKey);
  } catch {
    // Opening should still work if the previous HTML already exists.
  }
  const abs = path.join(root, "novadiff-docs", bundleKey, "index.html");
  const err = await shell.openPath(abs);
  if (err) {
    throw new Error(err);
  }
});

function sendKnowledgeGraphProgress(event, payload) {
  const wc = event?.sender;
  if (!wc || wc.isDestroyed()) {
    return;
  }
  if (typeof payload === "string") {
    const parsed = payload.match(/(\d+)\s*\/\s*(\d+)/);
    wc.send("knowledge-graph-progress", {
      message: payload,
      phase: "extract",
      current: parsed ? Number(parsed[1]) : undefined,
      total: parsed ? Number(parsed[2]) : undefined,
    });
    return;
  }
  wc.send("knowledge-graph-progress", payload ?? { message: "" });
}

ipcMain.handle("knowledge-graph-build", async (event, payload) => {
  try {
    const projectRoot = String(payload?.projectRoot ?? "").trim();
    if (!projectRoot) {
      throw new Error("Missing projectRoot");
    }
    const side = String(payload?.side ?? "target").trim();
    const changes = Array.isArray(payload?.changes) ? payload.changes : [];
    const leftTitle = String(payload?.leftTitle ?? "Baseline").trim();
    const rightTitle = String(payload?.rightTitle ?? "Target").trim();
    const projectLabel =
      side === "baseline" ? leftTitle : side === "both" ? `${leftTitle} + ${rightTitle}` : rightTitle;
    return await buildKnowledgeGraph({
      appPath: app.getAppPath(),
      projectRoot,
      projectLabel,
      changedPaths: changes,
      onProgress: (message) => sendKnowledgeGraphProgress(event, message),
    });
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("knowledge-graph-read", async (_evt, payload) => {
  try {
    const projectRoot = path.resolve(String(payload?.projectRoot ?? "").trim());
    if (!projectRoot) {
      throw new Error("Missing projectRoot");
    }
    const graphDir = path.join(projectRoot, ".novadiff-graph");
    const graphPath = path.join(graphDir, "knowledge-graph.json");
    if (!fssync.existsSync(graphPath)) {
      return { ok: false, ready: false, reason: "not_built", projectRoot };
    }
    const graph = JSON.parse(fssync.readFileSync(graphPath, "utf8"));
    if (Array.isArray(graph?.nodes)) {
      for (const node of graph.nodes) {
        if (typeof node.summary !== "string" || !String(node.summary).trim()) {
          node.summary =
            typeof node.name === "string" && node.name.trim()
              ? node.name.trim()
              : "Summary unavailable";
        }
      }
    }
    let diffOverlay = null;
    const overlayPath = path.join(graphDir, "diff-overlay.json");
    if (fssync.existsSync(overlayPath)) {
      diffOverlay = JSON.parse(fssync.readFileSync(overlayPath, "utf8"));
    }
    return { ok: true, projectRoot, graph, diffOverlay };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("knowledge-graph-read-file", async (_evt, payload) => {
  try {
    const projectRoot = path.resolve(String(payload?.projectRoot ?? "").trim());
    const relPath = String(payload?.relativePath ?? "").trim();
    if (!projectRoot || !relPath) {
      throw new Error("Missing projectRoot or relativePath");
    }
    const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
    if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
      throw new Error("Invalid path");
    }
    const abs = path.join(projectRoot, normalized);
    if (!abs.startsWith(projectRoot)) {
      throw new Error("Path escapes project root");
    }
    const content = fssync.readFileSync(abs, "utf8");
    const ext = path.extname(abs).slice(1).toLowerCase();
    const languageByExt = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      go: "go",
      rs: "rust",
      java: "java",
      md: "markdown",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      css: "css",
      html: "markup",
    };
    const language = languageByExt[ext] ?? "text";
    const sizeBytes = Buffer.byteLength(content, "utf8");
    const lineCount = content.split("\n").length;
    return {
      path: normalized.split(path.sep).join("/"),
      language,
      content,
      sizeBytes,
      lineCount,
    };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-detect-tooling", async () => {
  try {
    const git = detectGitTooling();
    const gh = getAuthStatus();
    return { git, gh };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-repo-status", async (_evt, payload) => {
  try {
    const repoRoot = String(payload?.repoRoot ?? "").trim();
    if (!repoRoot) {
      throw new Error("Missing repoRoot");
    }
    return getRepoStatus(repoRoot);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-discover-repos", async (_evt, payload) => {
  try {
    return discoverRepos(payload ?? {});
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-match-local-repo", async (_evt, payload) => {
  try {
    const owner = String(payload?.owner ?? "").trim();
    const repo = String(payload?.repo ?? "").trim();
    const extraRoots = Array.isArray(payload?.extraRoots) ? payload.extraRoots : [];
    if (!owner || !repo) {
      throw new Error("Missing owner or repo");
    }
    return matchRepoForGithubRepo(owner, repo, extraRoots);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-list-repos", async (_evt, payload) => {
  try {
    const limit = Number(payload?.limit ?? 50);
    return listRepos(limit);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-list-prs", async (_evt, payload) => {
  try {
    const fullName = String(payload?.repository ?? "").trim();
    const state = String(payload?.state ?? "open").trim();
    const limit = Number(payload?.limit ?? 40);
    if (!fullName) {
      throw new Error("Missing repository (owner/repo)");
    }
    return listPullRequests(fullName, state, limit);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-pr-compare-roots", async (_evt, payload) => {
  try {
    const repoRoot = String(payload?.repoRoot ?? "").trim();
    const baseRef = String(payload?.baseRef ?? "origin/main").trim();
    const headRef = String(payload?.headRef ?? "HEAD").trim();
    if (!repoRoot || !isGitRepo(repoRoot)) {
      throw new Error("Valid git repoRoot required");
    }
    return preparePrCompareRoots(repoRoot, baseRef, headRef);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-pr-view", async (_evt, payload) => {
  try {
    const fullName = String(payload?.repository ?? "").trim();
    const number = Number(payload?.number);
    if (!fullName || !Number.isFinite(number)) {
      throw new Error("Missing repository or PR number");
    }
    return viewPullRequest(fullName, number);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-publish-preview", async (_evt, payload) => {
  try {
    const repoRoot = String(payload?.repoRoot ?? "").trim();
    return previewPublish(repoRoot, payload ?? {});
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-publish-execute", async (_evt, payload) => {
  try {
    const repoRoot = String(payload?.repoRoot ?? "").trim();
    return await executePublish(repoRoot, payload ?? {});
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

function sendWorkspaceHistoryProgress(event, payload) {
  const wc = event?.sender;
  if (!wc || wc.isDestroyed()) {
    return;
  }
  wc.send("workspace-history-progress", payload ?? {});
}

ipcMain.handle("workspace-session-load", async () => {
  try {
    return await loadSession(app.getPath("userData"));
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-detected-users", async () => {
  try {
    return listDetectedAccounts();
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-user-profile", async () => {
  try {
    return getUserProfile();
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

function sendGithubAuthProgress(event, payload) {
  const wc = event?.sender;
  if (!wc || wc.isDestroyed()) {
    return;
  }
  wc.send("github-auth-progress", payload ?? {});
}

ipcMain.handle("github-gh-status", async () => {
  try {
    return getGhToolingStatus();
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-gh-install", async (event) => {
  try {
    const sendLog = (line) => {
      const wc = event?.sender;
      if (wc && !wc.isDestroyed()) {
        wc.send("github-gh-install-progress", { line });
      }
    };
    return await installGh(sendLog);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-set-local-only", async (_evt, payload) => {
  try {
    return await setLocalOnlyMode(app.getPath("userData"), Boolean(payload?.enabled));
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-start-auth", async (event) => {
  try {
    const result = await startGithubDeviceAuth((msg) => sendGithubAuthProgress(event, msg));
    return { ok: true, ...result };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("github-cancel-auth", async () => {
  cancelGithubDeviceAuth();
  return { ok: true };
});

ipcMain.handle("workspace-set-git-user", async (_evt, user) => {
  try {
    return await setGitUser(app.getPath("userData"), user);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-create", async (_evt, payload) => {
  try {
    const userData = app.getPath("userData");
    let repoRoot = String(payload?.repoRoot ?? "").trim();
    const cloneUrl = String(payload?.cloneUrl ?? "").trim();
    const name = String(payload?.name ?? "").trim();

    if (cloneUrl && !repoRoot) {
      const id = require("node:crypto").randomUUID();
      const dest = path.join(workspacesRoot(userData), id, "repo");
      await fsp.mkdir(path.dirname(dest), { recursive: true });
      await new Promise((resolve, reject) => {
        const child = spawn("git", ["clone", cloneUrl, dest], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        let err = "";
        child.stderr.on("data", (c) => {
          err += String(c);
        });
        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(err.trim() || `git clone failed (${code})`));
          }
        });
        child.on("error", reject);
      });
      repoRoot = dest;
    }

    if (!repoRoot || !isGitRepo(repoRoot)) {
      throw new Error("A valid git repository path is required");
    }

    let githubSlug = payload?.githubSlug ?? null;
    if (!githubSlug) {
      const st = getRepoStatus(repoRoot);
      const parsed = parseGithubSlugFromUrl(st.remotes[0]?.url ?? "");
      githubSlug = parsed ? `${parsed.owner}/${parsed.repo}` : null;
    }

    const { workspace, session } = await createWorkspace(userData, {
      name: name || path.basename(repoRoot),
      repoRoot,
      githubSlug,
    });

    const progressWc = BrowserWindow.getAllWindows().map((w) => w.webContents).find((wc) => !wc.isDestroyed());
    void indexWorkspaceHistory(userData, workspace.id, (msg) => {
      if (progressWc) {
        sendWorkspaceHistoryProgress({ sender: progressWc }, msg);
      }
    }).catch(async (err) => {
      const w = await getWorkspace(userData, workspace.id);
      if (w) {
        w.historyStatus = "error";
        w.historyError = err instanceof Error ? err.message : String(err);
        await require("./workspace-store.cjs").upsertWorkspace(userData, w);
      }
    });

    return { workspace, session };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-set-active", async (_evt, payload) => {
  try {
    const id = String(payload?.workspaceId ?? "").trim();
    return await setActiveWorkspace(app.getPath("userData"), id);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-list", async () => {
  try {
    return await listWorkspaces(app.getPath("userData"));
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-match-local", async (_evt, payload) => {
  try {
    const owner = String(payload?.owner ?? "").trim();
    const repo = String(payload?.repo ?? "").trim();
    return matchRepoForGithubRepo(owner, repo, payload?.extraRoots ?? []);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-update-live-repo", async (_evt, payload) => {
  try {
    const workspaceId = String(payload?.workspaceId ?? "").trim();
    const liveDevRepoRoot = String(payload?.liveDevRepoRoot ?? "").trim();
    return await updateWorkspaceLiveRepo(app.getPath("userData"), workspaceId, liveDevRepoRoot);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-update-ui-state", async (_evt, payload) => {
  try {
    const workspaceId = String(payload?.workspaceId ?? "").trim();
    const uiState = payload?.uiState ?? {};
    return await updateWorkspaceUiState(app.getPath("userData"), workspaceId, uiState);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("git-blame-at-ref", async (_evt, payload) => {
  try {
    const repoRoot = String(payload?.repoRoot ?? "").trim();
    const ref = String(payload?.ref ?? "HEAD").trim();
    const relPath = String(payload?.relPath ?? "").trim();
    if (!isGitRepo(repoRoot)) {
      throw new Error("Not a git repository");
    }
    return blameFileAtRef(repoRoot, ref, relPath);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-snapshot-list-files", async (_evt, payload) => {
  try {
    const snapshotPath = String(payload?.snapshotPath ?? "").trim();
    const files = await listSnapshotFiles(snapshotPath, { maxFiles: payload?.maxFiles ?? 2500 });
    return { files };
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-ensure-commit-snapshot", async (_evt, payload) => {
  try {
    const workspaceId = String(payload?.workspaceId ?? "").trim();
    const hash = String(payload?.hash ?? "").trim();
    const snapshotPath = String(payload?.snapshotPath ?? "").trim();
    return await ensureCommitSnapshot(app.getPath("userData"), workspaceId, hash, snapshotPath);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-snapshot-read-file", async (_evt, payload) => {
  try {
    const snapshotPath = String(payload?.snapshotPath ?? "").trim();
    const relPath = String(payload?.relPath ?? "").trim();
    return await readSnapshotTextFile(snapshotPath, relPath);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-index-history", async (event, payload) => {
  try {
    const workspaceId = String(payload?.workspaceId ?? "").trim();
    const userData = app.getPath("userData");
    const updated = await indexWorkspaceHistory(userData, workspaceId, (msg) =>
      sendWorkspaceHistoryProgress(event, msg),
    );
    return updated;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("workspace-refresh-history", async (event, payload) => {
  try {
    const workspaceId = String(payload?.workspaceId ?? "").trim();
    const fetchRemote = payload?.fetchRemote !== false;
    const userData = app.getPath("userData");
    const updated = await refreshWorkspaceHistory(
      userData,
      workspaceId,
      (msg) => sendWorkspaceHistoryProgress(event, msg),
      { fetchRemote },
    );
    return updated;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

app.on("before-quit", () => {
  cleanupNovadiffWorktrees();
});
