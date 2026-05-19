### Overview
A brand‑new stylesheet `src/components/onboarding/onboarding.css` has been added to provide the visual foundation for the onboarding flow. It defines the overlay, welcome screens, user cards, device‑code blocks, and related UI elements.

### Key changes
- **Overlay styling** – `.onboarding-overlay` now covers the viewport with `position: fixed; inset: 0; z-index: 12000;` and a backdrop blur.
- **Welcome screen layout** – `.welcome-screen` and `.workspace-hub` share a centered container (`width: min(720px, 100%); margin: 0 auto;`).
- **User card interactions** – `.welcome-user-card` gains hover and selected states, changing border color and background via `color-mix`.
- **Device‑code block** – `.welcome-device-code-block` and `.welcome-device-code` provide a prominent, monospace‑styled code display.
- **Responsive grid** – `.git-history-pickers` switches to a single column on screens ≤640 px.
- **Miscellaneous UI helpers** – classes for avatars, buttons, and consent sections are added for consistency across onboarding steps.

### Impact
- **UI correctness** – The new CSS will render the onboarding overlay and related components; missing imports could leave the UI unstyled.
- **Maintainability** – Centralizing onboarding styles reduces duplication but increases the file size (~262 lines). Future style changes should target this file to avoid scattered overrides.
- **Performance** – The overlay’s `backdrop-filter: blur(8px)` may impact rendering on low‑end devices; monitor frame rates during onboarding.
- **Compatibility** – Uses modern CSS features (`color-mix`, `inset`) that may not be supported in older browsers; ensure polyfills or fallbacks if needed.

### Risks & follow‑ups
- **Missing CSS import** – Verify that `onboarding.css` is imported in the onboarding component or global styles; otherwise the UI will appear unstyled.
- **Specificity clashes** – Existing global styles might override these new classes; run visual regression tests to confirm appearance.
- **Backwards compatibility** – Test on browsers that lack `color-mix` support; consider graceful degradation.
- **Performance regression** – Profile the onboarding flow on target devices to ensure the backdrop blur does not cause jank.
