### Overview  
A new `ThemePicker` component is added at `packages/graph-view/src/components/ThemePicker.tsx` (lines 1‑180). It renders a button that toggles a dropdown for selecting theme presets, accent colors, and heading fonts. The component relies on the existing `useTheme` hook, the `PRESETS` array, and the i18n context.

### Key changes  
- **Imports** (R1‑R4):  
  ```ts
  import { useCallback, useEffect, useRef, useState } from "react";
  import { useTheme, PRESETS } from "../themes/index.ts";
  import type { HeadingFont } from "../themes/index.ts";
  import { useI18n } from "../contexts/I18nContext";
  ```
- **Export** (R6): `export function ThemePicker()`.
- **State & refs** (R8‑R10): `open` toggle, `ref` to the root element, and `t` from `useI18n`.
- **Event handling** (R12‑R32): two `useEffect` hooks close the picker on outside clicks and on the Escape key.
- **Preset handling** (R34‑R39): `handlePreset` calls `setPreset` from `useTheme`.
- **Render tree** (R41‑R179): a button toggles the dropdown; the dropdown contains preset buttons, accent swatches, and heading‑font options, styled with Tailwind‑like utility classes and conditional classes based on the current config.

### Impact  
- The component mutates theme state via `setPreset`, `setAccent`, and `setHeadingFont`.  
- It depends on the `PRESETS` data structure and i18n keys such as `t.themePicker.changeTheme`.  
- New CSS classes (`glass-heavy`, `bg-accent/15`, etc.) are introduced; they must exist in the global stylesheet.

### Risks & follow‑ups  
- **Data shape**: Verify that `PRESETS` contains `id`, `colors`, `accentSwatches`, and `defaultAccentId`.  
- **i18n keys**: Ensure `t.themePicker.*` translations are defined; otherwise missing text will appear.  
- **Event handling**: Test that clicking outside or pressing Escape closes the picker across browsers.  
- **Theme hook**: Confirm that `useTheme` exposes `setPreset`, `setAccent`, and `setHeadingFont`; otherwise the component will error.
