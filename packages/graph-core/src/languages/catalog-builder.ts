import type { LanguageConfig } from "./types.js";
import type { LanguageCatalogEntry } from "./catalog-types.js";
import { alphabeticalCatalogEntries } from "./alphabetical-catalog.generated.js";

const EMPTY_FILE_PATTERNS = {
  entryPoints: [] as string[],
  barrels: [] as string[],
  tests: [] as string[],
  config: [] as string[],
};

export function catalogEntryToLanguageConfig(entry: LanguageCatalogEntry): LanguageConfig {
  const config: LanguageConfig = {
    id: entry.id,
    displayName: entry.displayName,
    extensions: entry.extensions,
    concepts: [],
    filePatterns: { ...EMPTY_FILE_PATTERNS },
  };
  if (entry.filenames?.length) {
    config.filenames = entry.filenames;
  }
  if (entry.wasmsFile) {
    config.treeSitter = { wasmsFile: entry.wasmsFile };
  }
  return config;
}

export function buildAlphabeticalLanguageConfigs(): LanguageConfig[] {
  return alphabeticalCatalogEntries.map(catalogEntryToLanguageConfig);
}

export function listAlphabeticalLanguages(): ReadonlyArray<{
  id: string;
  displayName: string;
  extensions: readonly string[];
  hasTreeSitter: boolean;
}> {
  return alphabeticalCatalogEntries.map((e) => ({
    id: e.id,
    displayName: e.displayName,
    extensions: e.extensions,
    hasTreeSitter: Boolean(e.wasmsFile),
  }));
}
