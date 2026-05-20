### Overview  
A new component `src/components/LlmSettingsModal.tsx` (lines 1‑149) introduces a modal for configuring local LLM providers (Ollama or LM Studio). It exports `LlmSettingsModalProps` and internally manages provider, base URL, model, probe status, and busy state.

### Key changes  
- **Imports** (R1‑4): `useEffect`, `useState` from React; types `LlmProvider`, `LlmSettings`; `saveLlmSettings`; `AnimatedOverlay`.  
- **Props interface** (R6‑10): `open: boolean`, `initial: LlmSettings`, `onClose: () => void`, `onSaved: (s: LlmSettings) => void`.  
- **State** (R19‑23): `provider`, `baseUrl`, `model`, `probe`, `busy`.  
- **useEffect** (R25‑32): resets state when `open` or `initial` changes.  
- **Preset logic** (R34‑42): `applyPreset` sets defaults for Ollama (`http://127.0.0.1:11434`, `llama3.2`) or LM Studio (`http://127.0.0.1:1234`, `local-model`).  
- **UI** (R45‑147): provider buttons, input fields, a test‑connection button that calls `window.electronAPI?.llmProbe`, and a save button that persists settings via `saveLlmSettings` and triggers `onSaved`.

### Impact  
- **Performance**: All state updates are local to the modal; negligible overhead.  
- **Maintainability**: Centralizes LLM configuration; adding new providers can reuse `applyPreset`.  
- **Observability**: The `probe` message provides immediate feedback on connection tests.

### Risks & follow‑ups  
- **Electron API availability**: The test button is disabled if `window.electronAPI?.llmProbe` is undefined; confirm this API is exposed in the renderer.  
- **Prop validation**: Callers must supply a complete `initial` `LlmSettings`; missing fields could break state initialization.  
- **CSS classes**: Ensure `llm-modal-backdrop`, `llm-modal`, etc., exist to avoid layout issues.  
- **Persistence**: Verify that `saveLlmSettings` writes correctly and that `onSaved` updates parent state.
