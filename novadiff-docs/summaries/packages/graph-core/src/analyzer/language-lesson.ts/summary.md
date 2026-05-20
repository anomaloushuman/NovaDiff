### Overview  
`packages/graph-core/src/analyzer/language-lesson.ts` is a new module that adds a lightweight LLM‑driven lesson generator for graph nodes. It introduces a `LanguageLessonResult` interface, utilities for detecting language concepts, prompt construction, and helpers for extracting and parsing JSON from LLM responses.

### Key changes  
- **Imports (lines 1‑2):** `GraphNode`, `GraphEdge`, and `LanguageConfig` types are pulled into the analyzer module.  
- **`LanguageLessonResult` (lines 4‑7):** Declares `languageNotes: string` and `concepts: Array<{ name: string; explanation: string }>` for the lesson output.  
- **Base concept patterns (lines 13‑42):** A static map of common language concepts that is merged with language‑specific concepts from `LanguageConfig`.  
- **`buildConceptPatterns` (lines 48‑63):** Merges base patterns with optional `langConfig.concepts`, ensuring each concept has a keyword list.  
- **`detectLanguageConcepts` (lines 69‑92):** Scans a node’s tags, summary, and `languageNotes` for keywords, returning matched concept names.  
- **`getLanguageDisplayName` (lines 99‑107):** Returns a user‑friendly language name, falling back to capitalization.  
- **`buildLanguageLessonPrompt` (lines 112‑155):** Builds a prompt that asks an LLM to produce a lesson, including node metadata, relationships, and detected concepts.  
- **`extractJson` (lines 160‑172):** Strips markdown fences or extracts the first JSON object from an LLM response.  
- **`parseLanguageLessonResponse` (lines 178‑210):** Safely parses the LLM output into a `LanguageLessonResult`, providing defaults on failure.

### Impact  
- **Correctness:** Adds deterministic concept detection and robust JSON extraction, reducing parsing errors.  
- **Maintainability:** Centralizes language‑specific logic; new concepts can be added via `LanguageConfig`.  
- **Performance:** Linear scans over node text; negligible overhead for typical graph sizes.  
- **Compatibility:** No API changes to existing modules; the file is purely additive.

### Risks & follow‑ups  
- **`LanguageConfig` availability:** Verify that the type is exported from `../languages/types.js` and that consumers provide it when needed.  
- **Prompt length:** Unknown from the available diff/scan evidence whether the generated prompt stays within LLM token limits for large graphs.  
- **JSON extraction edge cases:** Unknown; add unit tests for responses with nested code blocks or malformed JSON.  
- **Integration testing:** Unknown; confirm that downstream consumers correctly handle the new `LanguageLessonResult` shape.
