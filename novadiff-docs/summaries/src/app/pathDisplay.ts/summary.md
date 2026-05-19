### Overview
A new file `src/app/pathDisplay.ts` was added. It exports the helper `pathDisplayLabel(absPath: string): string`. The file begins with the comment  
`/** User‑facing path label — never expose full filesystem paths outside onboarding. */`.

### Key changes
- **Function signature**: `export function pathDisplayLabel(absPath: string): string` (added at R2).  
- **Whitespace handling**: `const trimmed = absPath.trim();` returns `""` if `trimmed` is empty (R3‑R5).  
- **Path normalization**: backslashes are replaced with forward slashes, the string is split on `/`, and empty segments are filtered out (R7).  
- **Segment logic**:  
  - No segments → return `trimmed` (R8‑R9).  
  - One segment → return that segment (R10‑R12).  
  - Two or more segments → return `${parts[parts.length - 2]}/${parts[parts.length - 1]}` (R13‑R14).  
- The function body spans lines R1‑R15.

### Impact
- Centralizes path‑label logic in a single, pure TypeScript utility.  
- Guarantees that only the last one or two path segments are exposed, in line with the comment about avoiding full filesystem paths.  
- No other modules are modified; the change is self‑contained.  
- Operates in O(n) time over the input string, adding negligible overhead.

### Risks & follow‑ups
- **Edge cases**: behavior with multiple consecutive slashes, trailing slashes, or UNC paths is not shown in the diff.  
- **Testing**: unit tests should cover empty input, single‑segment paths, multi‑segment paths, and Windows backslashes.  
- **Linting**: ensure the new file passes the repository’s TypeScript linting (`tsc`, `eslint`).  
- **Documentation**: update any onboarding documentation that references path display logic to point to this helper.
