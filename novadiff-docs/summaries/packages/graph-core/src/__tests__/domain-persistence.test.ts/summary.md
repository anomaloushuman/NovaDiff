### Overview  
A new test file `packages/graph-core/src/__tests__/domain-persistence.test.ts` (added lines 1‑6) validates the domain‑graph persistence helpers. It imports `vitest` utilities, Node `fs`, `path`, `os` modules, and the persistence API (`saveDomainGraph`, `loadDomainGraph`) from `../persistence/index.js`. The test uses the `KnowledgeGraph` type from `../types.js`.

### Key changes  
* **Test setup** – `testRoot` is defined as `join(tmpdir(), "ua-domain-persist-test")` (line 8).  
* **Lifecycle hooks** – `beforeEach` (lines 36‑39) removes any existing `testRoot` and recreates it; `afterEach` (lines 41‑43) cleans it up.  
* **Sample graph** – a minimal `KnowledgeGraph` (`domainGraph`, lines 10‑33) contains one domain node (`id: "domain:orders"`).  
* **Persistence tests** –  
  * `saves and loads domain graph` (lines 45‑50) checks that `loadDomainGraph` returns a graph with
