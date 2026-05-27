import type { ThemeConfig } from "./types.ts";

const EMBED_DARK_THEME: ThemeConfig = {
  presetId: "dark-ocean",
  accentId: "purple",
  headingFont: "sans",
};

const EMBED_LIGHT_THEME: ThemeConfig = {
  presetId: "light-minimal",
  accentId: "ocean",
  headingFont: "sans",
};

/**
 * Resolve the embed graph theme from the current OS/browser color scheme.
 * Falls back to dark when matchMedia is unavailable.
 */
export function resolveNovaDiffEmbedTheme(): ThemeConfig {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return EMBED_DARK_THEME;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? EMBED_LIGHT_THEME
    : EMBED_DARK_THEME;
}
