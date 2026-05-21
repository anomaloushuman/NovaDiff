### Overview  
`CodeCityLegend` now accepts three optional props—`repoRoot?: string`, `onStageFile?: (path: string) => void`, and `onStageDistrict?: (topDir: string) => void`—and renders additional action buttons for the selected building. The component’s signature now spans lines 3‑147 instead of 3‑121 (see diff lines R11‑R13 and R22‑R24).

### Key changes  
- **Props API** – new optional props added at the top of the function signature (diff lines R11‑R13, R22‑R24).  
- **UI actions** – the former “Open diff” block (lines 89‑97) was removed and replaced by a `<div className="code-city-selected-actions">` (lines 95‑123). Inside this div:  
  - “Open diff” button appears whenever `onOpenDiff` is supplied.  
  - “Stage file” button appears when both `repoRoot` and `onStageFile` are present.  
  - “Stage district” button appears when `repoRoot`, `onStageDistrict`, and `selected.topDirectory` are all defined.  
  Each button’s `onClick` calls the corresponding callback with `selected.path` or `selected.topDirectory`.  

### Impact  
- **Backward compatibility** – all new props are optional, so existing callers compile unchanged.  
- **Type safety** – callers who wish to use staging features must provide the matching callbacks.  
- **UI consistency** – the legend now offers staging actions, improving workflow for users working with a local repository.  
- **Performance** – negligible; only a few conditional renders were added.  

### Risks & follow‑ups  
- **Missing callbacks** – if `repoRoot` is omitted, the “Stage file” and “Stage district” buttons will not appear, potentially confusing users who expect staging actions.  
- **Test coverage** – unit tests should be updated to cover the new action buttons and verify that callbacks receive the correct arguments.  
- **Accessibility** – no evidence in the diff indicates ARIA labels or keyboard focus handling; confirm that the added buttons are accessible.
