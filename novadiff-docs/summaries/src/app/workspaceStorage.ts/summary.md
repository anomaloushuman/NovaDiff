### Overview  
`src/app/workspaceStorage.ts` now tracks product‑tour completion.  
A new key `PRODUCT_TOUR_KEY` and two helper functions were added.

### Key changes  
- **Line 6**: `const PRODUCT_TOUR_KEY = "novadiff_product_tour_v1"` (R6).  
- **Lines 8‑12**: `export function loadProductTourCompleted(): boolean` (R8‑R12).  
  * Reads `localStorage.getItem(PRODUCT_TOUR_KEY)` inside a `try/catch`.  
  * Returns `true` only when the stored value is `"1"`.  
- **Lines 16‑22**: `export function saveProductTourCompleted(): void` (R16‑R22).  
  * Writes `"1"` to `localStorage` inside a `try/catch`.  
  * Errors are silently ignored.

### Impact  
- Adds a dedicated API for persisting the tour‑completion flag.  
- Centralizes the key and storage logic; future changes can be made in one place.  
- No existing exports are removed, so the change is additive.

### Risks & follow‑ups  
- **Environment safety**: The `try/catch` guards are intended to prevent crashes when `localStorage` is unavailable (e.g., SSR or Node). Verify that this guard behaves as expected in all target environments.  
- **Test coverage**: Add unit tests for `loadProductTourCompleted` and `saveProductTourCompleted` to confirm correct behavior when storage is present, missing, or throws.  
- **Key collision**: Ensure `PRODUCT_TOUR_KEY` does not clash with other keys in the application.  
- **Regression**: Confirm that existing code paths that interact with `localStorage` continue to work after these additions.
