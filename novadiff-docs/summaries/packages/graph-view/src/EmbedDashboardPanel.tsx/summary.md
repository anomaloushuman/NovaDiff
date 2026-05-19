### Overview
Adds a new embeddable dashboard panel component (`EmbedDashboardPanel`) with full chrome and project‑wide class depth to `packages/graph-view/src`.

### Key changes
- **Imports**: React hooks, `ReactFlowProvider`, `@xyflow/react` CSS, `GraphIssue` type, `DashboardContent`, `useDashboardStore`, `ThemeProvider`, and `NOVADIFF_EMBED_THEME`.
- **`FlowDimensions` type** and **`EmbedSizedDashboard`** component that uses a `ResizeObserver` to set the pane’s width/height.
- **`EmbedDashboardPanelProps`** interface exposing optional `accessToken` and `graphIssues`.
- **`EmbedDashboardPanel`** pulls `graph` from the store, wraps content in `ThemeProvider` with `NOVADIFF_EMBED_THEME`, and conditionally renders the sized dashboard or a “Preparing graph…” overlay.
- Default values: `accessToken="__novadiff__"` and `graphIssues=[]`.

### Impact
- Global CSS import `@xyflow/react/dist/style.css` may interfere with existing styles.
- `ResizeObserver` usage could affect performance or require a polyfill on older browsers.
- The placeholder `accessToken` must be overridden for authenticated usage; otherwise requests may fail or expose data.
- Component depends on `useDashboardStore`; it will error if rendered outside the store provider.
- New public surface requires documentation and tests to cover its API and rendering behavior.

### Risks & follow‑ups
- **Style conflicts
