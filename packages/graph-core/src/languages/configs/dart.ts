import type { LanguageConfig } from "../types.js";

export const dartConfig = {
  id: "dart",
  displayName: "Dart",
  extensions: [".dart"],
  treeSitter: { wasmsFile: "tree-sitter-dart.wasm" },
  concepts: [
    "async/await",
    "futures",
    "mixins",
    "extensions",
    "null safety",
    "generics",
    "isolates",
  ],
  filePatterns: {
    entryPoints: ["lib/main.dart", "bin/*.dart"],
    barrels: [],
    tests: ["*_test.dart", "test/**/*.dart"],
    config: ["pubspec.yaml", "analysis_options.yaml"],
  },
} satisfies LanguageConfig;
