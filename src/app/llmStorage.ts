export type LlmProvider = "ollama" | "lmstudio";

export interface LlmSettings {
  provider: LlmProvider;
  baseUrl: string;
  model: string;
}

export interface LlmSummarizePayload extends LlmSettings {
  relPath: string;
  kind: string;
  leftLabel: string;
  rightLabel: string;
  lineAdditions?: number;
  lineDeletions?: number;
  truncated?: boolean;
  diffExcerpt?: string;
}

const STORAGE_KEY = "novadiff_llm_settings_v1";

function defaultBase(p: LlmProvider): string {
  return p === "lmstudio" ? "http://127.0.0.1:1234" : "http://127.0.0.1:11434";
}

function defaultModel(p: LlmProvider): string {
  return p === "lmstudio" ? "local-model" : "llama3.2";
}

export function defaultLlmSettings(): LlmSettings {
  return {
    provider: "ollama",
    baseUrl: defaultBase("ollama"),
    model: defaultModel("ollama"),
  };
}

export function loadLlmSettings(): LlmSettings {
  const d = defaultLlmSettings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return d;
    const j = JSON.parse(raw) as Record<string, unknown>;
    const provider: LlmProvider =
      j.provider === "lmstudio" ? "lmstudio" : "ollama";
    return {
      provider,
      baseUrl:
        typeof j.baseUrl === "string" && j.baseUrl.trim()
          ? j.baseUrl.trim()
          : defaultBase(provider),
      model:
        typeof j.model === "string" && j.model.trim()
          ? j.model.trim()
          : defaultModel(provider),
    };
  } catch {
    return d;
  }
}

export function saveLlmSettings(s: LlmSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
