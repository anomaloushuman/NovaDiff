### Overview  
`src/app/llmStorage.ts` introduces LLM configuration types and persistence helpers.

### Key changes  
- **Imports** – `FileSummaryEvidence`, `DiffSelectionLineRange`, `DiffSelectionSymbolMatch`, `RiskSignal`, `SelectionDocMode` from `./types` (R1‑R6).  
- **Provider & settings** – `export type LlmProvider = "ollama" | "lmstudio"` (R9) and `export interface LlmSettings` with `provider`, `baseUrl`, `model` (R11‑R15).  
- **Payload** – `export interface LlmSummarizePayload extends LlmSettings` adds many fields for diff context and summarization metadata (R17‑R62).  
- **Defaults** – `defaultBase` and `defaultModel` return provider‑specific URLs and model names (R66‑R73).  
- **Lifecycle** – `defaultLlmSettings` (R74‑R80), `loadLlmSettings` (R82‑R104) reads from `localStorage` key `novadiff_llm_settings_v1` with JSON parsing and fallbacks, and `saveLlmSettings` (R106‑R108) writes the JSON string.

### Impact  
- Centralizes LLM configuration and persistence; future provider changes can be added in one place.  
- Uses synchronous `localStorage` access; invoked during initialization or settings changes.

### Risks & follow‑ups  
- **Environment safety** – `localStorage` may be unavailable in non‑browser contexts; guard usage or provide fallback (unknown from the available diff/scan evidence).  
- **JSON schema drift** – mismatched stored objects may silently default; ensure stored shape matches `LlmSettings`.  
- **Provider defaults** – verify that `defaultBase` and `defaultModel` match actual server endpoints.  
- **Type coverage** – extensive `LlmSummarizePayload` fields are not yet exercised; add unit tests for serialization/deserialization.
