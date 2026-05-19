### Overview
A new test file, `packages/graph-core/src/__tests__/parsers.test.ts` (lines R1‑629), has been added. It imports `vitest` helpers and all 12 parser classes plus `stripJsoncSyntax` and `registerAllParsers`. The file contains unit tests that exercise each parser with realistic content and edge‑case scenarios.

### Key changes
- **Imports** – Lines R1‑R6 add `vitest` (`describe`, `it`, `expect`) and parser imports (`MarkdownParser`, `YAMLConfigParser`, `JSONConfigParser`, `TOMLParser`, `EnvParser`, `DockerfileParser`, `SQLParser`, `GraphQLParser`, `ProtobufParser`, `TerraformParser`, `MakefileParser`, `ShellParser`) plus `stripJsoncSyntax` and `registerAllParsers`.  
- **Parser tests** – Each `describe` block (e.g., `MarkdownParser`, `YAMLConfigParser`, …) contains tests that assert sections, imports, references, definitions, and edge cases such as fenced code blocks, YAML front‑matter, JSONC comments, TOML tables, Dockerfile stages, SQL view/replace syntax, GraphQL input types, Protobuf enums, Terraform modules, Makefile `.PHONY`, and Shell function syntax.  
- **Registry test** – Lines 611‑629 verify that `registerAllParsers` registers all 12 parsers and that the registry reports the expected language identifiers.

### Impact
- **Correctness** – The tests provide a safety net for future parser changes, catching regressions in extraction logic and language registration.  
- **Maintenance** – Any incomplete parser implementation will cause a test failure, surfacing issues immediately during CI.  
- **Performance** – The added tests are lightweight; the overall test suite size grows but runtime impact is minimal.  
- **Observability** – Failures pinpoint the specific parser and scenario, aiding rapid debugging.

### Risks & follow‑ups
- **Implementation gaps** – If a parser is incomplete, its tests will fail; review implementation against the expectations.  
- **Snapshot/fixture drift** – Tests rely on exact output structures; intentional API changes must be reflected in the test expectations.  
- **Environment setup** – `vitest` must be correctly configured; otherwise the entire suite may fail.  
- **Edge‑case coverage** – While extensive, rare syntax variations may still be missed; monitor for false negatives in production.
