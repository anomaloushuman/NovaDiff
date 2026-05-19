import { useEffect, useState } from "react";
import type { LlmProvider, LlmSettings } from "../app/llmStorage";
import { saveLlmSettings } from "../app/llmStorage";
import { AnimatedOverlay } from "./ui/AnimatedOverlay";

interface LlmSettingsModalProps {
  open: boolean;
  initial: LlmSettings;
  onClose: () => void;
  onSaved: (s: LlmSettings) => void;
}

export function LlmSettingsModal({
  open,
  initial,
  onClose,
  onSaved,
}: LlmSettingsModalProps) {
  const [provider, setProvider] = useState<LlmProvider>(initial.provider);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [probe, setProbe] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setProvider(initial.provider);
      setBaseUrl(initial.baseUrl);
      setModel(initial.model);
      setProbe(null);
    }
  }, [open, initial]);

  const applyPreset = (p: LlmProvider) => {
    setProvider(p);
    if (p === "ollama") {
      setBaseUrl("http://127.0.0.1:11434");
      setModel("llama3.2");
    } else {
      setBaseUrl("http://127.0.0.1:1234");
      setModel("local-model");
    }
  };

  return (
    <AnimatedOverlay
      open={open}
      onClose={onClose}
      backdropClassName="llm-modal-backdrop"
      panelClassName="llm-modal"
      labelledBy="llm-modal-title"
    >
      <h2 id="llm-modal-title" className="llm-modal-title">
        Local LLM (Ollama / LM Studio)
      </h2>
      <p className="llm-modal-hint">
        File summaries call your machine over HTTP and are rendered as Markdown (GFM).
        Ollama defaults to port <code>11434</code>, LM Studio server usually{" "}
        <code>1234</code>. GPU acceleration is handled inside those apps (Metal on Mac).
        NovaDiff assumes a high-context local setup for large file summaries.
      </p>

      <div className="llm-field">
        <span className="llm-label">Provider</span>
        <div className="llm-seg">
          <button
            type="button"
            className={provider === "ollama" ? "active" : ""}
            onClick={() => applyPreset("ollama")}
          >
            Ollama
          </button>
          <button
            type="button"
            className={provider === "lmstudio" ? "active" : ""}
            onClick={() => applyPreset("lmstudio")}
          >
            LM Studio
          </button>
        </div>
      </div>

      <label className="llm-field">
        <span className="llm-label">Base URL</span>
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          spellCheck={false}
          className="llm-input"
        />
      </label>

      <label className="llm-field">
        <span className="llm-label">Model name</span>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          spellCheck={false}
          className="llm-input"
          placeholder={provider === "ollama" ? "llama3.2" : "local-model"}
        />
      </label>

      {probe && <p className="llm-probe">{probe}</p>}

      <div className="llm-actions">
        <button type="button" className="llm-btn ghost" onClick={() => void onClose()}>
          Cancel
        </button>
        <button
          type="button"
          className="llm-btn ghost"
          disabled={busy || !window.electronAPI?.llmProbe}
          onClick={() => {
            setBusy(true);
            setProbe(null);
            window.electronAPI
              ?.llmProbe?.({ provider, baseUrl, model })
              .then((r) => {
                setProbe(`Connected. Sample reply: ${(r?.reply ?? "ok").slice(0, 120)}`);
              })
              .catch((e) => {
                setProbe(e instanceof Error ? e.message : String(e));
              })
              .finally(() => setBusy(false));
          }}
        >
          Test connection
        </button>
        <button
          type="button"
          className="llm-btn primary"
          onClick={() => {
            const s: LlmSettings = {
              provider,
              baseUrl: baseUrl.trim(),
              model: model.trim(),
            };
            saveLlmSettings(s);
            onSaved(s);
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </AnimatedOverlay>
  );
}
