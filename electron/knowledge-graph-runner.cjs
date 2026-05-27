"use strict";

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");
const { pathToFileURL } = require("node:url");
const { createRequire } = require("node:module");

const BATCH_SIZE = 24;
const MAX_FILES = 800;
const EXTRACT_TIMEOUT_MS = 12 * 60 * 1000;
const MAX_ANALYZE_LINES = 12_000;
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "release",
  "target",
  "coverage",
  ".novadiff-graph",
  "novadiff-docs",
  ".next",
  ".turbo",
  ".cache",
  ".cursor",
  "vendor",
  "__pycache__",
  "venv",
  ".venv",
  ".venv-main",
]);

function resolveRepoRoot(appPath) {
  const candidates = [appPath, path.join(appPath, ".."), path.join(appPath, "..", "..")];
  for (const candidate of candidates) {
    const corePkg = path.join(candidate, "packages", "graph-core", "package.json");
    if (fs.existsSync(corePkg)) {
      return path.resolve(candidate);
    }
  }
  return null;
}

function resolveNodeExecutable() {
  const override = String(process.env.NOVADIFF_NODE ?? "").trim();
  if (override && fs.existsSync(override)) {
    return override;
  }
  return process.execPath;
}

/** Env for child processes that must run JS (Electron binary acts as Node only with this flag). */
function nodeChildEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  if (resolveNodeExecutable() === process.execPath) {
    env.ELECTRON_RUN_AS_NODE = "1";
  }
  return env;
}

function runCommand(cwd, command, args, env = {}, timeoutMs = EXTRACT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
          }, timeoutMs)
        : null;
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (timer) {
        clearTimeout(timer);
      }
      if (timedOut) {
        reject(new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s`));
        return;
      }
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || `${command} exited ${code}`));
    });
  });
}

async function ensureGraphCoreBuilt(repoRoot, onProgress) {
  const coreDist = path.join(repoRoot, "packages", "graph-core", "dist", "index.js");
  if (fs.existsSync(coreDist)) {
    return;
  }
  onProgress?.("Building NovaDiff graph engine (first run may take a minute)…");
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  await runCommand(repoRoot, npm, ["run", "graph:core-build"]);
}

async function loadCore(repoRoot) {
  const requireFromRepo = createRequire(path.join(repoRoot, "package.json"));
  const corePath = requireFromRepo.resolve("@novadiff/graph-core");
  return import(pathToFileURL(corePath).href);
}

function isTextCandidate(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  const blocked = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".wasm",
    ".exe",
    ".dll",
    ".dylib",
    ".so",
    ".pak",
    ".asar",
    ".bin",
    ".lock",
  ]);
  if (blocked.has(ext)) {
    return false;
  }
  return true;
}

async function walkProjectFiles(projectRoot) {
  const out = [];
  async function walk(absDir, relPrefix) {
    let entries;
    try {
      entries = await fsp.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".venv")) {
          continue;
        }
        if (entry.name === "site-packages") {
          continue;
        }
        await walk(path.join(absDir, entry.name), rel);
        continue;
      }
      if (!entry.isFile() || !isTextCandidate(rel)) {
        continue;
      }
      let stat;
      try {
        stat = await fsp.stat(path.join(absDir, entry.name));
      } catch {
        continue;
      }
      if (stat.size > 512 * 1024) {
        continue;
      }
      out.push(rel.split(path.sep).join("/"));
      if (out.length >= MAX_FILES) {
        return;
      }
    }
  }
  await walk(projectRoot, "");
  return out.sort((a, b) => a.localeCompare(b));
}

function detectLanguage(relPath, languageRegistry) {
  if (languageRegistry?.getForFile) {
    const match = languageRegistry.getForFile(relPath.replace(/\\/g, "/"));
    if (match?.id) {
      return match.id;
    }
  }
  const ext = path.extname(relPath).slice(1).toLowerCase();
  const map = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    rs: "rust",
    py: "python",
    go: "go",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    swift: "swift",
    rb: "ruby",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    cc: "cpp",
    c: "c",
    h: "c",
    hpp: "cpp",
    scala: "scala",
    sc: "scala",
    dart: "dart",
    lua: "lua",
    md: "markdown",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    sql: "sql",
    sh: "shell",
    css: "css",
    html: "html",
  };
  return map[ext] ?? "unknown";
}

function fileCategory(relPath, language) {
  if (["markdown", "json", "yaml", "toml", "sql"].includes(language)) {
    return "config";
  }
  if (language === "unknown") {
    return "other";
  }
  return "code";
}

function resolveRelativeImport(fromRel, importSource) {
  const source = String(importSource ?? "").trim();
  if (!source.startsWith(".")) {
    return null;
  }
  const fromDir = path.posix.dirname(fromRel.split(path.sep).join("/"));
  const joined = path.posix.normalize(path.posix.join(fromDir, source));
  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    `${joined}.jsx`,
    `${joined}.mjs`,
    `${joined}.cjs`,
    `${joined}/index.ts`,
    `${joined}/index.tsx`,
    `${joined}/index.js`,
    `${joined}.swift`,
    `${joined}.kt`,
    `${joined}.kts`,
    `${joined}.java`,
    `${joined}.py`,
    `${joined}.rs`,
    `${joined}.go`,
    `${joined}.scala`,
    `${joined}.dart`,
    `${joined}.lua`,
    `${joined}.php`,
    `${joined}.rb`,
    `${joined}.cs`,
    `${joined}.cpp`,
    `${joined}.c`,
  ];
  return candidates;
}

function buildBatchImportData(projectRoot, fileRels, extractResults) {
  const fileSet = new Set(fileRels);
  const batchImportData = {};
  for (const result of extractResults) {
    const rel = result.path;
    const resolved = [];
    for (const imp of result.imports ?? []) {
      const source = imp?.source ?? imp;
      if (typeof source !== "string" || !source.startsWith(".")) {
        continue;
      }
      for (const candidate of resolveRelativeImport(rel, source)) {
        if (fileSet.has(candidate)) {
          resolved.push(candidate);
          break;
        }
      }
    }
    if (resolved.length > 0) {
      batchImportData[rel] = [...new Set(resolved)];
    }
  }
  return batchImportData;
}

async function runExtractStructureBatch(repoRoot, projectRoot, batchFiles, batchImportData) {
  const scriptPath = path.join(__dirname, "graph", "extract-structure.mjs");
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Structure extractor missing: ${scriptPath}`);
  }
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "novadiff-kg-"));
  const inputPath = path.join(tmpDir, "input.json");
  const outputPath = path.join(tmpDir, "output.json");
  const payload = {
    projectRoot,
    batchFiles,
    batchImportData,
  };
  await fsp.writeFile(inputPath, JSON.stringify(payload), "utf8");
  const nodeExec = resolveNodeExecutable();
  try {
    await runCommand(
      repoRoot,
      nodeExec,
      [scriptPath, inputPath, outputPath],
      nodeChildEnv(),
    );
  } catch (e) {
    const hint =
      nodeExec === process.execPath
        ? " (ensure ELECTRON_RUN_AS_NODE is set for subprocess)"
        : "";
    throw new Error(`${e instanceof Error ? e.message : String(e)}${hint}`);
  }
  if (!fs.existsSync(outputPath)) {
    throw new Error("Structure extractor produced no output file");
  }
  const raw = await fsp.readFile(outputPath, "utf8");
  await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.results) ? parsed.results : [];
}

function mapStructuralAnalysis(result) {
  return {
    functions: (result.functions ?? []).map((fn) => ({
      name: fn.name,
      lineRange: [fn.startLine, fn.endLine],
      params: fn.params ?? [],
    })),
    classes: (result.classes ?? []).map((cls) => ({
      name: cls.name,
      lineRange: [cls.startLine, cls.endLine],
      methods: cls.methods ?? [],
      properties: cls.properties ?? [],
    })),
    exports: (result.exports ?? []).map((exp) => ({
      name: exp.name,
      lineNumber: exp.line,
      isDefault: exp.isDefault === true,
    })),
    imports: [],
    sections: (result.sections ?? []).map((section) => ({
      name: section.heading,
      level: section.level,
      lineRange: [section.line, section.line],
    })),
    definitions: (result.definitions ?? []).map((def) => ({
      name: def.name,
      kind: def.kind,
      fields: def.fields ?? [],
      lineRange: [def.startLine, def.endLine],
    })),
    services: result.services ?? [],
    endpoints: result.endpoints ?? [],
    steps: result.steps ?? [],
    resources: result.resources ?? [],
  };
}

function heuristicComplexity(totalLines) {
  if (totalLines > 400) {
    return "complex";
  }
  if (totalLines > 120) {
    return "moderate";
  }
  return "simple";
}

function buildFileMeta(result) {
  const summaries = {};
  for (const fn of result.functions ?? []) {
    summaries[fn.name] = `Function ${fn.name} (L${fn.startLine}-${fn.endLine})`;
  }
  for (const cls of result.classes ?? []) {
    summaries[cls.name] = `Class ${cls.name} (L${cls.startLine}-${cls.endLine})`;
  }
  const fnCount = result.functions?.length ?? 0;
  const clsCount = result.classes?.length ?? 0;
  const complexity = heuristicComplexity(result.totalLines ?? 0);
  return {
    fileSummary: `${path.basename(result.path)} — ${fnCount} functions, ${clsCount} classes, ${result.totalLines ?? 0} lines`,
    tags: [result.language, result.fileCategory].filter(Boolean),
    complexity,
    summaries,
  };
}

function topSegment(relPath) {
  const normalized = relPath.split(path.sep).join("/");
  const slash = normalized.indexOf("/");
  return slash === -1 ? "." : normalized.slice(0, slash);
}

function buildLayersFromFiles(fileRels) {
  const counts = new Map();
  for (const rel of fileRels) {
    const seg = topSegment(rel);
    counts.set(seg, (counts.get(seg) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count], index) => ({
      id: `layer:${name}`,
      name: name === "." ? "root" : name,
      description: `${count} files in this area`,
      order: index,
      color: null,
      nodeIds: [],
    }));
}

function assignNodeLayers(graph) {
  const layerByName = new Map(graph.layers.map((layer) => [layer.name, layer.id]));
  const nodeIdsByLayer = new Map(graph.layers.map((layer) => [layer.id, []]));

  for (const node of graph.nodes) {
    if (!node.filePath) {
      continue;
    }
    const seg = topSegment(node.filePath);
    const layerName = seg === "." ? "root" : seg;
    const layerId = layerByName.get(layerName);
    if (!layerId) {
      continue;
    }
    node.layerId = layerId;
    nodeIdsByLayer.get(layerId).push(node.id);
  }

  graph.layers = graph.layers.map((layer) => ({
    ...layer,
    nodeIds: nodeIdsByLayer.get(layer.id) ?? [],
  }));
  return graph;
}

function buildDiffOverlay(graph, changedPaths) {
  const changedSet = new Set(
    (changedPaths ?? []).map((p) => String(p ?? "").trim()).filter(Boolean),
  );
  if (changedSet.size === 0) {
    return null;
  }
  const changedNodeIds = [];
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const node of graph.nodes) {
    if (!node.filePath) {
      continue;
    }
    if (changedSet.has(node.filePath)) {
      changedNodeIds.push(node.id);
    }
  }
  const changedIdSet = new Set(changedNodeIds);
  const affectedNodeIds = [];
  for (const edge of graph.edges) {
    if (changedIdSet.has(edge.source) && !changedIdSet.has(edge.target)) {
      affectedNodeIds.push(edge.target);
    }
    if (changedIdSet.has(edge.target) && !changedIdSet.has(edge.source)) {
      affectedNodeIds.push(edge.source);
    }
  }
  return {
    version: "1.0.0",
    baseBranch: "novadiff-compare",
    generatedAt: new Date().toISOString(),
    changedFiles: [...changedSet],
    changedNodeIds: [...new Set(changedNodeIds)],
    affectedNodeIds: [...new Set(affectedNodeIds)].filter((id) => !changedIdSet.has(id)),
  };
}

async function getGitHash(projectRoot) {
  try {
    const { stdout } = await runCommand(projectRoot, "git", ["rev-parse", "HEAD"]);
    return stdout.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Build a deterministic knowledge graph (no LLM) for a project root.
 * @param {object} opts
 * @param {string} opts.appPath
 * @param {string} opts.projectRoot
 * @param {string} [opts.projectLabel]
 * @param {Array<{path:string, kind?:string}>} [opts.changedPaths]
 * @param {(msg:string)=>void} [opts.onProgress]
 */
async function buildKnowledgeGraph(opts) {
  const appPath = String(opts.appPath ?? "").trim();
  const projectRoot = path.resolve(String(opts.projectRoot ?? "").trim());
  if (!projectRoot) {
    throw new Error("Missing projectRoot");
  }
  const repoRoot = resolveRepoRoot(appPath);
  if (!repoRoot) {
    throw new Error("NovaDiff graph engine not found (packages/graph-core is missing).");
  }
  const onProgress = typeof opts.onProgress === "function" ? opts.onProgress : () => {};
  await ensureGraphCoreBuilt(repoRoot, (msg) => onProgress(msg));
  const core = await loadCore(repoRoot);
  const { GraphBuilder, saveGraph, saveMeta, LanguageRegistry } = core;
  const languageRegistry = LanguageRegistry.createDefault();

  onProgress({ message: "Scanning project files…", phase: "scan" });
  const fileRels = await walkProjectFiles(projectRoot);
  if (fileRels.length === 0) {
    throw new Error("No analyzable files found in project root");
  }

  const batchFiles = fileRels.map((rel) => {
    const language = detectLanguage(rel, languageRegistry);
    return {
      path: rel,
      language,
      sizeLines: 0,
      fileCategory: fileCategory(rel, language),
    };
  });

  const extractResults = [];
  const totalFiles = batchFiles.length;
  const batchCount = Math.ceil(totalFiles / BATCH_SIZE);
  for (let index = 0; index < batchFiles.length; index += BATCH_SIZE) {
    const slice = batchFiles.slice(index, index + BATCH_SIZE);
    const batchIndex = Math.floor(index / BATCH_SIZE) + 1;
    const batchStart = index;
    onProgress({
      message: `Extracting structure ${batchStart}/${totalFiles} (batch ${batchIndex}/${batchCount})…`,
      phase: "extract",
      current: batchStart,
      total: totalFiles,
    });
    const batchImportData = buildBatchImportData(projectRoot, fileRels, extractResults);
    const batchOut = await runExtractStructureBatch(
      repoRoot,
      projectRoot,
      slice,
      batchImportData,
    );
    extractResults.push(...batchOut);
    const completedFiles = Math.min(index + slice.length, totalFiles);
    onProgress({
      message: `Extracting structure ${completedFiles}/${totalFiles} (batch ${batchIndex}/${batchCount})…`,
      phase: "extract",
      current: completedFiles,
      total: totalFiles,
    });
  }

  onProgress({ message: "Assembling knowledge graph…", phase: "assemble" });
  const projectName =
    String(opts.projectLabel ?? "").trim() || path.basename(projectRoot) || "project";
  const gitHash = await getGitHash(projectRoot);
  const builder = new GraphBuilder(projectName, gitHash);

  const importData = buildBatchImportData(projectRoot, fileRels, extractResults);
  for (const result of extractResults) {
    const rel = result.path;
    const structural = mapStructuralAnalysis(result);
    const meta = buildFileMeta(result);
    const hasCodeChildren =
      (structural.functions?.length ?? 0) > 0 || (structural.classes?.length ?? 0) > 0;
    const hasNonCodeChildren =
      (structural.definitions?.length ?? 0) > 0 ||
      (structural.sections?.length ?? 0) > 0 ||
      (structural.services?.length ?? 0) > 0 ||
      (structural.endpoints?.length ?? 0) > 0;

    if (hasCodeChildren) {
      builder.addFileWithAnalysis(rel, structural, meta);
    } else if (hasNonCodeChildren) {
      builder.addNonCodeFileWithAnalysis(rel, {
        summary: meta.fileSummary,
        tags: meta.tags,
        complexity: meta.complexity,
        nodeType: result.fileCategory === "config" ? "config" : "document",
        definitions: structural.definitions,
        services: structural.services,
        endpoints: structural.endpoints,
        steps: structural.steps,
        resources: structural.resources,
        sections: structural.sections,
      });
    } else {
      builder.addFile(rel, {
        summary: meta.fileSummary,
        tags: meta.tags,
        complexity: meta.complexity,
      });
    }

    for (const target of importData[rel] ?? []) {
      builder.addImportEdge(rel, target);
    }
  }

  let graph = builder.build();
  graph.layers = buildLayersFromFiles(fileRels);
  graph = assignNodeLayers(graph);
  graph.kind = "codebase";
  graph.project.description =
    "Deterministic NovaDiff knowledge graph (Tree-sitter structure, imports, and compare overlay).";

  const graphDir = path.join(projectRoot, ".novadiff-graph");
  await fsp.mkdir(graphDir, { recursive: true });
  saveGraph(projectRoot, graph);
  saveMeta(projectRoot, {
    lastAnalyzedAt: new Date().toISOString(),
    gitCommitHash: gitHash,
    version: "1.0.0",
    analyzedFiles: fileRels.length,
  });
  if (typeof core.saveConfig === "function") {
    core.saveConfig(projectRoot, { autoUpdate: false, outputLanguage: "en" });
  }

  const overlay = buildDiffOverlay(
    graph,
    (opts.changedPaths ?? []).map((row) => row.path ?? row),
  );
  if (overlay) {
    await fsp.writeFile(
      path.join(graphDir, "diff-overlay.json"),
      `${JSON.stringify(overlay, null, 2)}\n`,
      "utf8",
    );
  }

  onProgress({
    message: "Knowledge graph ready",
    phase: "done",
    current: totalFiles,
    total: totalFiles,
  });
  return {
    ok: true,
    projectRoot,
    graphPath: path.join(graphDir, "knowledge-graph.json"),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    fileCount: fileRels.length,
    hasDiffOverlay: Boolean(overlay),
  };
}

module.exports = {
  resolveRepoRoot,
  ensureGraphCoreBuilt,
  buildKnowledgeGraph,
};
