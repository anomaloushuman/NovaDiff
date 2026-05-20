### Overview  
A new module `src/app/pathDisplay.ts` adds the exported helper `pathDisplayLabel` (lines 2‑15).  
It trims whitespace, normalizes slashes, and returns only the last one or two path segments, never the full absolute path.

### Key changes  
- **Export**: `export function pathDisplayLabel(absPath: string): string` (lines 2‑15).  
- **Sanitization**: trims the input and returns an empty string for empty or whitespace‑only paths (lines 3‑6).  
- **Normalization**: replaces backslashes with forward slashes, splits on `/`, and removes empty segments (line 7).  
- **Segment selection**:  
  - If no segments remain, returns the trimmed input (lines 8‑10).  
  - If one segment exists, returns that segment (lines 11‑13).  
  - Otherwise returns the last two segments joined by `/` (lines 14‑15).  
- **Documentation comment**: clarifies that the label is for onboarding UI and should never expose full paths (line 1).

### Impact  
- **Security**: The function never returns a full absolute path, mitigating accidental exposure of filesystem structure.  
- **Centralization**: Path‑label logic is now in a single, reusable utility.  
- **No API changes**: Existing modules are unaffected; only new imports are required.

### Risks & follow‑ups  
- **Edge‑case handling**: Behavior with root paths (`/`, `C:\\`), UNC paths, or paths with multiple consecutive slashes is unknown from the available diff/scan evidence.  
- **Integration**: Verify that UI components previously constructing path labels now import and use `pathDisplayLabel`.  
- **Testing**: Add unit tests for empty, single‑segment, multi‑segment, and mixed‑slash inputs.  
- **Documentation**: Update onboarding or security docs to reference the new helper and its safety guarantees.
