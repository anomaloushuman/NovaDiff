"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const LLM_STREAM = "llm-stream-token";

contextBridge.exposeInMainWorld("electronAPI", {
  compareFolders: (left, right) =>
    ipcRenderer.invoke("compare-folders", left, right),
  getFileDiff: (leftRoot, rightRoot, relPath, kind) =>
    ipcRenderer.invoke("get-file-diff", leftRoot, rightRoot, relPath, kind),
  pickDirectory: () => ipcRenderer.invoke("pick-directory"),
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
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
