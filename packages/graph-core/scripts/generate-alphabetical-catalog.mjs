#!/usr/bin/env node
/**
 * Generates alphabetical-catalog.generated.ts from language-names.txt
 * Run: node packages/graph-core/scripts/generate-alphabetical-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const namesPath = join(__dirname, "language-names.txt");
const outPath = join(__dirname, "../src/languages/alphabetical-catalog.generated.ts");

/** tree-sitter-wasms/out/*.wasm */
const WASMS_BY_KEY = {
  bash: "tree-sitter-bash.wasm",
  c: "tree-sitter-c.wasm",
  csharp: "tree-sitter-c_sharp.wasm",
  cpp: "tree-sitter-cpp.wasm",
  css: "tree-sitter-css.wasm",
  dart: "tree-sitter-dart.wasm",
  elisp: "tree-sitter-elisp.wasm",
  elixir: "tree-sitter-elixir.wasm",
  elm: "tree-sitter-elm.wasm",
  embedded_template: "tree-sitter-embedded_template.wasm",
  go: "tree-sitter-go.wasm",
  html: "tree-sitter-html.wasm",
  java: "tree-sitter-java.wasm",
  javascript: "tree-sitter-javascript.wasm",
  json: "tree-sitter-json.wasm",
  kotlin: "tree-sitter-kotlin.wasm",
  lua: "tree-sitter-lua.wasm",
  objc: "tree-sitter-objc.wasm",
  ocaml: "tree-sitter-ocaml.wasm",
  php: "tree-sitter-php.wasm",
  python: "tree-sitter-python.wasm",
  ql: "tree-sitter-ql.wasm",
  rescript: "tree-sitter-rescript.wasm",
  ruby: "tree-sitter-ruby.wasm",
  rust: "tree-sitter-rust.wasm",
  scala: "tree-sitter-scala.wasm",
  solidity: "tree-sitter-solidity.wasm",
  swift: "tree-sitter-swift.wasm",
  toml: "tree-sitter-toml.wasm",
  typescript: "tree-sitter-typescript.wasm",
  vue: "tree-sitter-vue.wasm",
  yaml: "tree-sitter-yaml.wasm",
  zig: "tree-sitter-zig.wasm",
};

/** Normalized lookup key -> extensions (no leading dot in values) */
const EXT_BY_KEY = {
  "a.net": [".adb", ".dbs"],
  abap: [".abap"],
  actionscript: [".as"],
  ada: [".adb", ".ads"],
  agda: [".agda"],
  applescript: [".applescript", ".scpt"],
  assembly: [".asm", ".s", ".S"],
  assemblyscript: [".ts", ".as"],
  autohotkey: [".ahk"],
  autoit: [".au3"],
  awk: [".awk"],
  ballerina: [".bal"],
  bash: [".sh", ".bash"],
  basic: [".bas", ".vb", ".bas"],
  batch: [".bat", ".cmd"],
  c: [".c", ".h"],
  "c--": [".c"],
  "c++": [".cpp", ".cc", ".cxx", ".hpp", ".hh"],
  "c#": [".cs"],
  ceylon: [".ceylon"],
  chapel: [".chpl"],
  clojure: [".clj", ".cljs", ".cljc"],
  cobol: [".cob", ".cbl", ".cpy"],
  coffeescript: [".coffee", ".litcoffee"],
  crystal: [".cr"],
  css: [".css"],
  cython: [".pyx", ".pxd"],
  d: [".d"],
  dart: [".dart"],
  delphi: [".pas", ".dpr"],
  dlang: [".d"],
  dockerfile: [".dockerfile"],
  dylan: [".dylan", ".intr"],
  ecmascript: [".js", ".mjs"],
  elixir: [".ex", ".exs"],
  elm: [".elm"],
  emacs: [".el"],
  erlang: [".erl", ".hrl"],
  fsharp: [".fs", ".fsi", ".fsx"],
  fish: [".fish"],
  fortran: [".f", ".f90", ".f95", ".for"],
  forth: [".fth", ".fs"],
  fortran_iso: [".f", ".f90"],
  gdscript: [".gd"],
  gleam: [".gleam"],
  glsl: [".glsl", ".vert", ".frag"],
  go: [".go"],
  groovy: [".groovy", ".gradle"],
  hack: [".hack"],
  haskell: [".hs", ".lhs"],
  haxe: [".hx"],
  hlsl: [".hlsl", ".fx", ".fxh"],
  html: [".html", ".htm"],
  hy: [".hy"],
  idris: [".idr"],
  java: [".java"],
  javascript: [".js", ".mjs", ".cjs"],
  julia: [".jl"],
  kotlin: [".kt", ".kts"],
  latex: [".tex", ".latex"],
  lisp: [".lisp", ".lsp", ".cl"],
  "common lisp": [".lisp", ".cl"],
  livescript: [".ls"],
  llvm: [".ll"],
  lua: [".lua"],
  makefile: [".mk"],
  markdown: [".md", ".markdown"],
  matlab: [".m"],
  mercury: [".m"],
  mojo: [".mojo"],
  nim: [".nim"],
  nix: [".nix"],
  objectivec: [".m", ".mm"],
  ocaml: [".ml", ".mli"],
  octave: [".m"],
  opencl: [".cl"],
  pascal: [".pas", ".pp"],
  perl: [".pl", ".pm"],
  php: [".php"],
  pony: [".pony"],
  postscript: [".ps", ".eps"],
  powershell: [".ps1", ".psm1"],
  prolog: [".pl", ".pro"],
  protobuf: [".proto"],
  purescript: [".purs"],
  python: [".py", ".pyw", ".pyi"],
  qsharp: [".qs"],
  r: [".r", ".R"],
  racket: [".rkt"],
  raku: [".raku", ".rakumod"],
  reason: [".re", ".rei"],
  rebol: [".r"],
  red: [".red", ".reds"],
  rescript: [".res", ".resi"],
  ruby: [".rb", ".rake", ".gemspec"],
  rust: [".rs"],
  sas: [".sas"],
  scala: [".scala", ".sc"],
  scheme: [".scm", ".ss"],
  scilab: [".sci"],
  sed: [".sed"],
  solidity: [".sol"],
  sql: [".sql"],
  squirrel: [".nut"],
  stata: [".do", ".ado"],
  swift: [".swift"],
  tcl: [".tcl"],
  terraform: [".tf", ".tfvars"],
  tex: [".tex"],
  toml: [".toml"],
  typescript: [".ts", ".tsx"],
  v: [".v"],
  vala: [".vala"],
  vb: [".vb"],
  verilog: [".v", ".sv"],
  vhdl: [".vhdl", ".vhd"],
  vim: [".vim"],
  visualbasic: [".vb", ".bas"],
  vue: [".vue"],
  wasm: [".wasm", ".wat"],
  wolfram: [".wl", ".wls", ".m"],
  xml: [".xml", ".xsd", ".xsl"],
  xquery: [".xq", ".xquery"],
  xslt: [".xslt", ".xsl"],
  yaml: [".yaml", ".yml"],
  zig: [".zig"],
  zsh: [".zsh"],
};

function normalizeKey(name) {
  let s = name
    .replace(/\s*–.*$/, "")
    .replace(/\s*—.*$/, "")
    .replace(/\s*-\s*ISO.*$/i, "")
    .replace(/\s*\(.*$/, "")
    .trim()
    .toLowerCase();
  s = s.replace(/^c\+\+.*$/, "c++");
  s = s.replace(/^c#.*$/, "c#");
  s = s.replace(/^f#.*$/, "fsharp");
  s = s.replace(/^j#.*$/, "jsharp");
  s = s.replace(/^j\+\+.*$/, "jpp");
  if (s === "c – iso/iec 9899") s = "c";
  if (s.startsWith("swift")) s = "swift";
  if (s.includes("objective-c")) s = "objectivec";
  if (s.includes("assembly language")) s = "assembly";
  if (s.includes("batch file")) s = "batch";
  if (s.includes("ecmascript")) s = "ecmascript";
  if (s.includes("common lisp")) s = "common lisp";
  if (s.includes("d ") || s === "d") s = "d";
  if (s.includes("dlang") || s.includes("also known as dlang")) s = "dlang";
  if (s.includes("transact-sql") || s === "t-sql") s = "sql";
  if (s.includes("webassembly")) s = "wasm";
  if (s.includes("wolfram")) s = "wolfram";
  if (s.includes("z shell")) s = "zsh";
  if (s.includes("kornshell")) s = "bash";
  if (s.includes("c shell")) s = "bash";
  if (s === "r") s = "r";
  if (s === "b" || s === "c" || s === "d" || s === "e" || s === "f" || s === "j" || s === "k" || s === "p" || s === "q" || s === "r" || s === "s" || s === "t" || s === "v") {
    return null;
  }
  return s;
}

function slugify(name, used) {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56);
  if (!base) base = "lang";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n++}`;
  }
  used.add(id);
  return id;
}

function resolveWasmsKey(normKey, id) {
  if (!normKey) return null;
  if (WASMS_BY_KEY[normKey]) return normKey;
  const aliases = {
    "c++": "cpp",
    "c#": "csharp",
    "c sharp": "csharp",
    objectivec: "objc",
    ecmascript: "javascript",
    "common lisp": "elisp",
    emacs: "elisp",
    fsharp: null,
    jsharp: "csharp",
    cobol: null,
    fortran: null,
    haskell: null,
    matlab: null,
    wolfram: null,
    rescript: "rescript",
    vue: "vue",
    graphql: null,
    cypher: "ql",
    "cypher query language": "ql",
    hlsl: null,
    glsl: null,
  };
  const mapped = aliases[normKey] ?? normKey;
  return WASMS_BY_KEY[mapped] ? mapped : null;
}

function resolveExtensions(normKey, displayName) {
  if (normKey && EXT_BY_KEY[normKey]) return EXT_BY_KEY[normKey];
  const dn = displayName.toLowerCase();
  for (const [key, exts] of Object.entries(EXT_BY_KEY)) {
    if (dn.includes(key) && key.length > 2) return exts;
  }
  return [];
}

const raw = readFileSync(namesPath, "utf8");
const lines = raw
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && l.length > 1 && !/^[A-Z]$/.test(l));

const usedIds = new Set();
const usedExtensions = new Set();
const entries = [];

function claimExtensions(exts, wasmsFile) {
  const out = [];
  for (const ext of exts) {
    const key = ext.toLowerCase();
    if (usedExtensions.has(key)) continue;
    usedExtensions.add(key);
    out.push(ext);
  }
  return out;
}

for (const displayName of lines) {
  const normKey = normalizeKey(displayName);
  const id = slugify(displayName, usedIds);
  const wasmsKey = resolveWasmsKey(normKey, id);
  const wasmsFile = wasmsKey ? WASMS_BY_KEY[wasmsKey] : undefined;
  const extensions = claimExtensions(resolveExtensions(normKey, displayName), wasmsFile);
  entries.push({ id, displayName, extensions, wasmsFile });
}

entries.sort((a, b) => a.displayName.localeCompare(b.displayName, "en"));

const body = entries
  .map((e) => {
    const ext = JSON.stringify(e.extensions);
    const wasms = e.wasmsFile ? `, wasmsFile: ${JSON.stringify(e.wasmsFile)}` : "";
    return `  { id: ${JSON.stringify(e.id)}, displayName: ${JSON.stringify(e.displayName)}, extensions: ${ext}${wasms} },`;
  })
  .join("\n");

const file = `/* AUTO-GENERATED by scripts/generate-alphabetical-catalog.mjs — do not edit */
import type { LanguageCatalogEntry } from "./catalog-types.js";

/** ${entries.length} languages, sorted A→Z by display name. */
export const alphabeticalCatalogEntries: LanguageCatalogEntry[] = [
${body}
];
`;

writeFileSync(outPath, file, "utf8");
console.log(`Wrote ${entries.length} languages to ${outPath}`);
console.log(`With tree-sitter WASM: ${entries.filter((e) => e.wasmsFile).length}`);
