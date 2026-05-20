### Overview  
A new test file `packages/graph-core/src/__tests__/language-registry.test.ts` (lines 1‑198) was added to exercise the `LanguageRegistry` implementation.

### Key changes  
- **Imports (lines 1‑5)**:  
  ```ts
  import { describe, it, expect } from "vitest";
  import { LanguageRegistry } from "../languages/language-registry.js";
  import { StrictLanguageConfigSchema } from "../languages/types.js";
  import { typescriptConfig } from "../languages/configs/typescript.js";
  import { pythonConfig } from "../languages/configs/python.js";
  ```
- **Basic registry tests (lines 7‑27)**: verify `register`, `getById`, `getByExtension`, `getForFile`, and `getAllLanguages`.
- **`createDefault` tests (lines 51‑87)**: confirm 40 built‑in configs, correct extension mapping, no duplicate extensions, and that each config has at least one concept.
- **Non‑code language detection (lines 96‑146)**: test file‑extension and filename‑based detection for Dockerfile, Makefile, `.env`, and other common non‑code files.
- **Schema validation (lines 148‑198)**: ensure `StrictLanguageConfigSchema` rejects configs lacking extensions or filenames and accepts valid ones.

### Impact  
The added tests provide concrete coverage for registry operations and schema enforcement. Any future change to `LanguageRegistry` or language config definitions will be caught by these tests.

### Risks & follow‑ups  
- Modifying `LanguageRegistry` or language config definitions may break the tests; run the full suite after changes.  
- If language configs evolve, expectations in the tests may need updating.  
- The duplicate‑extension test will flag any new config that re‑uses an existing extension.
