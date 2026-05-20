### Overview  
A new test file `packages/graph-core/src/analyzer/graph-builder.test.ts` (lines R1‑R404) has been added. It imports `vitest` helpers, `GraphBuilder`, and the `StructuralAnalysis` type, and exercises the builder’s public API.

### Key changes  
- **Imports added** (R1‑R3):  
  ```ts
  import { describe, it, expect, vi } from "vitest";
  import { GraphBuilder } from "./graph-builder.js";
  import type { StructuralAnalysis } from "../types.js";
  ```
- **File node tests** (R5‑R23): verify `addFile` creates nodes with correct `id`, `type`, `name`, `filePath`, `summary`, `tags`, and `complexity`.
- **Structural analysis tests** (R41‑R93): `addFileWithAnalysis` is exercised for functions, classes, and the resulting `contains` edges.
- **Edge tests** (R95‑R178): import, call, and contains edges are asserted for correct source/target IDs and types.
- **Project metadata** (R180‑R203): `build()` populates `project` fields (`name`, `gitCommitHash`, `languages`, `analyzedAt`) and defaults (`version`, `layers`, `tour`).
- **Language detection** (R205‑R214, R216‑R339): tests cover polyglot projects, non‑code extensions, and the `EXTENSION_LANGUAGE` map.
- **Non‑code file support** (R216‑R403): tests for documents, definitions, services, endpoints, resources, steps, duplicate ID handling, and console warnings.

### Impact  
- **Correctness**: The tests assert the expected graph structure for a wide range of inputs, providing a safety net for future changes.  
- **Documentation**: The test file serves as living documentation of the `GraphBuilder` API.  
- **Observability**: Console warnings for unknown kinds or duplicate IDs are explicitly verified.

### Risks & follow‑ups  
- **Test failures**: Any change to the builder’s logic may cause many assertions to fail; run the suite and adjust implementation or tests.  
- **Ordering sensitivity**: The tests rely on specific node/edge ordering; changes could affect stability.  
- **Linting**: Ensure the new file passes the repository’s TypeScript linting rules (`npm run lint`).  
- **Performance**: The suite is large; monitor CI run times and consider splitting it if build times grow.
