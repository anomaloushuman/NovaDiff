### Overview  
A new component `SearchBar.tsx` (lines 1‑191) is added to `packages/graph-view/src/components`. It renders a text input that queries the dashboard store and shows a dropdown of the top five search results, with fuzzy/semantic mode toggles.

### Key changes  
- **Imports** – added React hooks (`useCallback`, `useEffect`, `useMemo`, `useRef`, `useState`) and store/context hooks (`useDashboardStore`, `useI18n`)【R1‑R3】.  
- **Badge color map** – `typeBadgeColors` maps node types to Tailwind classes (file, function, class, …)【R5‑R19】.  
- **State & refs** – `dropdownOpen`, `containerRef`, `inputRef` control visibility and focus【R34‑R36】.  
- **Node lookup** – `nodeMap` memoized from `graph?.nodes`【R38‑R42】.  
- **Event handlers** – `handleInputChange` updates `searchQuery` and opens the dropdown; `handleResultClick` navigates to a node and closes the dropdown【R46‑R60】.  
- **Effects** – two `useEffect` hooks close the dropdown on `Escape` key or outside clicks【R62‑R83】.  
- **Render** – input with icon, mode buttons, result count, and a dropdown that lists each result with a type badge, name, relevance bar, and click handler【R87‑R190】.

### Impact  
- Adds a persistent search bar to the graph view, exposing store slices (`searchQuery`, `searchResults`, `graph`, `setSearchQuery`, `navigateToNodeInLayer`, `searchMode`, `setSearchMode`).  
- Keeps rendering lightweight by limiting the dropdown to five items and memoizing the node map.  
- Provides test hooks (`data-testid="search-input"`) and keyboard focus handling via refs.

### Risks & follow‑ups  
- `nodeMap` relies on `graph?.nodes`; if `graph` is undefined the map will be empty, potentially hiding results.  
- The component depends on the exact shape of `useDashboardStore`; any missing slice will cause runtime errors.  
- Tailwind classes in `typeBadgeColors` must match the theme; mismatches could break styling.  
- Verify that the global `keydown` and `mousedown` listeners correctly close the dropdown across browsers.
