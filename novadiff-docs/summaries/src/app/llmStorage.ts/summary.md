### Overview  
`src/app/llmStorage.ts` extends the `LlmSummarizePayload` interface with five optional properties that provide richer context for LLM summarization. The additions appear at lines 56‑61 of the file.

### Key changes  
- `explainCode?: boolean` – flag to request a code explanation.  
- `codeExcerpt?: string` – raw code snippet.  
- `lineStart?: number` – start line of the excerpt.  
- `lineEnd?: number` – end line of the excerpt.  
- `symbolName?: string` – name of the symbol to explain.  
These fields are added after the existing `selectionSymbol` property in the interface.

### Impact  
- **Compatibility**: Existing payloads remain valid because the new fields are optional.  
- **Functionality**: Callers can now supply additional context, potentially improving LLM responses.  
- **Performance**: Adding optional properties does not alter runtime behavior.

### Risks & follow‑ups  
- Verify that modules importing `LlmSummarizePayload` compile after the change.  
- Update any test fixtures or mocks that construct `LlmSummarizePayload` to include the new optional fields if desired.  
- Ensure JSON serialization logic (e.g., `JSON.stringify`) handles the new fields without affecting existing output.  
- Run `npm run lint`, `npm test`, and the production build to confirm no new warnings or errors.
