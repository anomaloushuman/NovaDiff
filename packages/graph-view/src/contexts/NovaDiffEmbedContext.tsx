import { createContext, useContext } from "react";

export interface NovaDiffSourceFile {
  path: string;
  language: string;
  content: string;
  sizeBytes: number;
  lineCount: number;
}

export interface ExplainCodeRequest {
  filePath: string;
  startLine: number;
  endLine: number;
  snippet: string;
  symbolName?: string;
}

export interface NovaDiffEmbedContextValue {
  readFile?: (relativePath: string) => Promise<NovaDiffSourceFile>;
  /** Hosted inside NovaDiff documentation — softer chrome and issue filtering. */
  embedMode?: boolean;
  /** Stream an LLM explanation for a source selection; returns final markdown. */
  explainCode?: (
    request: ExplainCodeRequest,
    onChunk: (text: string) => void,
  ) => Promise<string>;
}

export const NovaDiffEmbedContext = createContext<NovaDiffEmbedContextValue>({});

export function useNovaDiffEmbed() {
  return useContext(NovaDiffEmbedContext);
}
