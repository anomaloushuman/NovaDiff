### Overview  
A new test file `packages/graph-core/src/__tests__/framework-registry.test.ts` (lines 1‑123) has been added. It imports `vitest` helpers and the `FrameworkRegistry`, `djangoConfig`, and `reactConfig` symbols (R1‑R4) and contains tests for registration, lookup, detection, and default‑registry behavior.

### Key changes  
- **Imports**: lines 1‑4 add `vitest` and framework config imports (R1‑R4).  
- **Registration tests**: lines 6‑11 verify that a framework can be registered and retrieved by ID, and that duplicate registrations are ignored (R6‑R10, R93‑R97).  
- **Language lookup**: lines 13‑20 test `getForLanguage` for known and unknown languages, and that the returned array is a copy (R13‑R20, R100‑R106).  
- **Detection**: lines 28‑71 cover detection from `requirements.txt` and `package.json`, case‑insensitivity, duplicate avoidance, and empty manifests (R28‑R71).  
- **Cross‑language & defaults**: lines 84‑98 test that `createDefault` registers all built‑in frameworks (10 total, R109‑R111) and that frameworks are available for multiple languages (Python, TypeScript, Java, Ruby, Go) (R114‑R120).

### Impact  
- Provides automated verification of `FrameworkRegistry` logic, reducing regressions when the registry implementation changes.  
- Ensures that default configuration remains consistent (10 frameworks, multi‑language support).  
- Test failures will surface during CI, aiding quick identification of registry issues.

### Risks & follow‑ups  
- **Test flakiness**: detection tests rely on hard‑coded manifest strings; if external data changes, tests may fail (unknown from the available diff/scan evidence).  
- **Future framework additions**: adding new frameworks will require updating the `createDefault` test to reflect the new count and language mappings.  
- **Linting/build**: run `npm run lint`, `npm run test`, and `npm run build` to confirm the new file does not introduce style or compilation errors.
