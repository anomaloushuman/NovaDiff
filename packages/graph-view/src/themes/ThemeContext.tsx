import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HeadingFont, PresetId, ThemeConfig, ThemePreset } from "./types.ts";
import { DEFAULT_THEME_CONFIG } from "./types.ts";
import { getPreset } from "./presets.ts";
import {
  applyLiquidGlassEmbedTheme,
  applyTheme,
  clearLiquidGlassEmbedTheme,
  clearTheme,
  isLiquidGlassHost,
} from "./theme-engine.ts";

const STORAGE_KEY = "ua-theme";

interface ThemeContextValue {
  config: ThemeConfig;
  preset: ThemePreset;
  setPreset: (presetId: PresetId) => void;
  setAccent: (accentId: string) => void;
  setHeadingFont: (font: HeadingFont) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadFromLocalStorage(): ThemeConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.presetId === "string" && typeof parsed.accentId === "string") {
      return parsed as ThemeConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(config: ThemeConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage full or unavailable — ignore
  }
}

function resolveInitialTheme(
  metaTheme?: ThemeConfig | null,
  scopeToHost?: boolean,
): ThemeConfig {
  if (scopeToHost) {
    return metaTheme ?? DEFAULT_THEME_CONFIG;
  }
  return loadFromLocalStorage() ?? metaTheme ?? DEFAULT_THEME_CONFIG;
}

interface ThemeProviderProps {
  metaTheme?: ThemeConfig | null;
  /** When true, theme tokens apply only to the wrapper host — not `document.documentElement`. */
  scopeToHost?: boolean;
  children: ReactNode;
}

export function ThemeProvider({ metaTheme, scopeToHost = false, children }: ThemeProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>(() =>
    resolveInitialTheme(metaTheme, scopeToHost),
  );
  const initialized = useRef(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  configRef.current = config;
  const [liquidGlassHost, setLiquidGlassHost] = useState(isLiquidGlassHost);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setLiquidGlassHost(isLiquidGlassHost());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Apply theme on mount and config changes (no clearTheme on re-apply — avoids embed layout thrash).
  useEffect(() => {
    if (scopeToHost) {
      const host = hostRef.current;
      if (!host) {
        return;
      }
      if (liquidGlassHost) {
        applyLiquidGlassEmbedTheme(config, host);
      } else {
        clearLiquidGlassEmbedTheme(host);
        applyTheme(config, host);
      }
    } else {
      applyTheme(config);
    }
    if (initialized.current && !scopeToHost) {
      saveToLocalStorage(config);
    }
    initialized.current = true;
  }, [config, scopeToHost, liquidGlassHost]);

  useEffect(() => {
    if (!scopeToHost) {
      return;
    }
    return () => {
      const host = hostRef.current;
      if (host) {
        clearLiquidGlassEmbedTheme(host);
        clearTheme(host, configRef.current);
      }
    };
  }, [scopeToHost]);

  // Update if metaTheme arrives later (async fetch) and no localStorage preference exists
  useEffect(() => {
    if (scopeToHost && metaTheme) {
      setConfig(metaTheme);
      return;
    }
    if (metaTheme && !loadFromLocalStorage()) {
      setConfig(metaTheme);
    }
  }, [metaTheme, scopeToHost]);

  const setPreset = useCallback((presetId: PresetId) => {
    setConfig((_prev) => {
      const newPreset = getPreset(presetId);
      return { presetId, accentId: newPreset.defaultAccentId };
    });
  }, []);

  const setAccent = useCallback((accentId: string) => {
    setConfig((prev) => ({ ...prev, accentId }));
  }, []);

  const setHeadingFont = useCallback((font: HeadingFont) => {
    setConfig((prev) => ({ ...prev, headingFont: font }));
  }, []);

  const preset = getPreset(config.presetId);

  return (
    <ThemeContext.Provider value={{ config, preset, setPreset, setAccent, setHeadingFont }}>
      {scopeToHost ? (
        <div
          ref={hostRef}
          className="novadiff-graph-theme-host h-full w-full min-h-0 flex flex-col"
        >
          {children}
        </div>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
