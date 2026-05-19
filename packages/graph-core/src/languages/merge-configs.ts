import type { LanguageConfig } from "./types.js";
import { buildAlphabeticalLanguageConfigs } from "./catalog-builder.js";

/**
 * Merge detailed hand-authored configs with the full alphabetical catalog.
 * Detailed configs win on id collision; result is sorted A→Z by displayName.
 */
export function mergeLanguageConfigs(detailed: LanguageConfig[]): LanguageConfig[] {
  const byId = new Map<string, LanguageConfig>();
  for (const config of buildAlphabeticalLanguageConfigs()) {
    byId.set(config.id, config);
  }
  for (const config of detailed) {
    byId.set(config.id, config);
  }
  return [...byId.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "en", { sensitivity: "base" }),
  );
}

/** Registration order: catalog first, then detailed (wins extension/file detection). */
export function languageConfigsForRegistry(detailed: LanguageConfig[]): LanguageConfig[] {
  const detailedIds = new Set(detailed.map((c) => c.id));
  const merged = mergeLanguageConfigs(detailed);
  const catalogOnly = merged.filter((c) => !detailedIds.has(c.id));
  return [...catalogOnly, ...detailed];
}
