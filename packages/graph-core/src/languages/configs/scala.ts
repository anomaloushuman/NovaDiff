import type { LanguageConfig } from "../types.js";

export const scalaConfig = {
  id: "scala",
  displayName: "Scala",
  extensions: [".scala", ".sc"],
  treeSitter: { wasmsFile: "tree-sitter-scala.wasm" },
  concepts: [
    "case classes",
    "pattern matching",
    "implicits",
    "traits",
    "companion objects",
    "for-comprehensions",
    "higher-kinded types",
    "futures",
  ],
  filePatterns: {
    entryPoints: ["**/App.scala", "**/Main.scala"],
    barrels: [],
    tests: ["*Spec.scala", "*Test.scala"],
    config: ["build.sbt", "build.sc", "pom.xml"],
  },
} satisfies LanguageConfig;
