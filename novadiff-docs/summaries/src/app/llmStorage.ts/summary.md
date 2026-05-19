### Overview  
The `LlmSummarizePayload` interface in `src/app/llmStorage.ts` was extended with five optional properties to provide richer context for code‑snippet summarization. The changes appear in the diff at lines 56‑61 of the interface definition.

### Key changes  
- `explainCode?: boolean` – flag to indicate that the LLM should explain a code snippet.  
- `codeExcerpt?: string` – the snippet text.  
- `lineStart?: number` and `lineEnd?: number` – the snippet’s line range.  
- `symbolName?: string` – the symbol being summarized.  
These additions are added after the existing `selectionSymbol` property.

### Impact  
- Existing payloads remain valid; the new fields are optional, so no breaking changes.  
- Consumers can now include snippet context without modifying the interface contract.  
- No runtime errors are introduced by the change.

### Risks & follow‑ups  
- Verify that serialization of `LlmSummarizePayload` to JSON omits undefined fields.  
- Update unit tests that validate payload shape to account for the optional properties.  
- Ensure that prompt‑generation logic handles `explainCode` and the snippet metadata correctly.
