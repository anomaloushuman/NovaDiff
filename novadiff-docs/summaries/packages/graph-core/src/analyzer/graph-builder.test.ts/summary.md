### Overview  
A new test in `packages/graph-core/src/analyzer/graph-builder.test.ts` (lines 363‑387) confirms that `GraphBuilder` now disambiguates duplicate function names within the same file by appending the function’s start line number to the node ID.

### Key changes  
- **Function ID generation** – When a file contains two functions with the same name, the second receives an ID suffix of its start line (`:30` in the test).  
- **Duplicate detection** – The builder tracks seen function names per file and applies the line‑number suffix only when a duplicate is detected.  
- **Test addition** – The test creates two `command` functions at line ranges `[10,20]` and `[30,40]` in `click/decorators.py`, then asserts that the graph contains two distinct nodes with IDs  
  `function:click/decorators.py:command` and `function:click/decorators.py:command:30`.

### Impact  
- **Correctness** – Prevents node‑ID collisions for duplicate function names, ensuring edges reference the intended nodes.  
- **Maintainability** – Deterministic IDs aid debugging and tooling such as graph visualizers.  
- **Compatibility** – No public API changes; existing consumers of `GraphBuilder` continue to work unchanged.

### Risks & follow‑ups  
- **Other node types** – Verify that similar duplicate‑name handling does not unintentionally affect classes, imports, or non‑code nodes.  
- **Existing tests** – Ensure no other tests rely on the old ID format for functions; run the full test suite.  
- **Edge‑case line numbers** – Confirm that functions with the same start line but different end lines still produce unique IDs.  
- **Logging** – The new logic should not introduce excessive console output; check that warnings remain only for truly duplicate IDs.
