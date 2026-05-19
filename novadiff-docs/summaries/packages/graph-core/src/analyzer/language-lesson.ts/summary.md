### Overview  
A new file `packages/graph-core/src/analyzer/language-lesson.ts` is added, exposing a public API for generating language‑specific lesson prompts, detecting concepts, and parsing LLM responses into a typed result.

### Key changes  
- **Imports**: `GraphNode`, `GraphEdge` from `../types.js` (R1) and `LanguageConfig` from `../languages/types.js` (R2).  
- **`LanguageLessonResult` interface** (lines 4‑7) defines `languageNotes: string` and `concepts: Array<{name: string; explanation: string}>` (R4‑R7).  
- **Base concept patterns** (`BASE_CONCEPT_PATTERNS`, lines 13‑42) and `buildConceptPatterns` (lines 48‑63) merge language‑agnostic and language‑specific keywords.  
- **`detectLanguageConcepts`** (lines 69‑92) scans node tags, summary, and `languageNotes` for pattern matches.  
- **`getLanguageDisplayName`** (lines 99‑107) resolves a human‑readable name from `LanguageConfig` or capitalizes the language string.  
- **`buildLanguageLessonPrompt`** (lines 112‑147) constructs an LLM prompt that includes node metadata, relationships, and detected concepts.  
- **`extractJson`** (lines 160‑172) extracts a JSON block from an LLM response, handling markdown fences.  
- **`parseLanguageLessonResponse`** (lines 178‑210) parses the response into `LanguageLessonResult`, returning defaults on failure.

### Impact  
- Provides a typed contract for lesson data, reducing downstream type errors.  
- Centralizes concept detection logic; new language configs can be added without modifying prompt logic.  
- Prompt construction is linear in node size; overhead is negligible for typical graph nodes (unknown from the available diff/scan evidence).

### Risks & follow‑ups  
- `parseLanguageLessonResponse` silently defaults on parse errors; add unit tests to verify graceful handling of malformed JSON.  
- Accuracy of `detectLanguageConcepts` depends on correct merging of base and language‑specific patterns; verify overlap handling.  
- Prompt length may grow with many relationships; consider trimming or summarizing relationships if token limits are a concern.
