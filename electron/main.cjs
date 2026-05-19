"use strict";

const fs = require("node:fs/promises");
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
const { runCompareEngine } = require("./compare-runner.cjs");
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

ipcMain.handle("compare-folders", (_evt, left, right) => {
  try {
    return runCompareEngine(
      app.getAppPath(),
      {
        cmd: "compare-folders",
        left,
        right,
      },
      app.isPackaged,
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

ipcMain.handle("filter-changes-gitignore", (_evt, payload) => {
  try {
    return runCompareEngine(
      app.getAppPath(),
      {
        cmd: "filter-changes-gitignore",
        changes: payload.changes,
        leftRoot: payload.leftRoot,
        rightRoot: payload.rightRoot,
      },
      app.isPackaged,
    );
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("codebase-outline", (_evt, root) => {
  try {
    return runCompareEngine(
      app.getAppPath(),
      { cmd: "codebase-outline", root },
      app.isPackaged,
    );
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
  }
});

ipcMain.handle("risk-signals", (_evt, payload) => {
  try {
    return runCompareEngine(
      app.getAppPath(),
      {
        cmd: "risk-signals",
        leftRoot: String(payload?.leftRoot ?? "").trim(),
        rightRoot: String(payload?.rightRoot ?? "").trim(),
        changes: Array.isArray(payload?.changes) ? payload.changes : [],
      },
      app.isPackaged,
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
