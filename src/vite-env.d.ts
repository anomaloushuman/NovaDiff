/// <reference types="vite/client" />

import type { FileChange, FileDiffPayload } from "./app/types";
import type { LlmSettings, LlmSummarizePayload } from "./app/llmStorage";

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
