"use strict";

const path = require("node:path");
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  nativeImage,
} = require("electron");
const { runCompareEngine } = require("./compare-runner.cjs");
const { summarizeChange, summarizeChangeStream, probeProvider } = require("./llm.cjs");

let mainWindow = null;

/** @type {Map<number, AbortController>} */
const llmStreamAbortByWebContentsId = new Map();

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
