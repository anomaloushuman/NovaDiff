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
});
