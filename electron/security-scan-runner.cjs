"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");

function severityFromAdvisory(input) {
  const value = String(input ?? "").toLowerCase();
  if (value === "critical" || value === "high") {
    return "high";
  }
  if (value === "moderate" || value === "medium") {
    return "medium";
  }
  return "low";
}

function confidenceFromSeverity(severity) {
  return severity === "high" ? "high" : severity === "medium" ? "medium" : "low";
}

function hashId(parts) {
  const raw = parts.filter(Boolean).join(":");
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

function relPathFromRoot(projectRoot, absolutePath) {
  const rel = path.relative(projectRoot, absolutePath).replace(/\\/g, "/");
  return rel && !rel.startsWith("..") ? rel : null;
}

function walkRepoForMarkers(projectRoot, maxDepth = 6) {
  /** @type {Array<{dir: string; depth: number}>} */
  const queue = [{ dir: projectRoot, depth: 0 }];
  /** @type {Set<string>} */
  const files = new Set();
  const skipDirs = new Set([
    ".git",
    "node_modules",
    ".next",
    ".nuxt",
    "dist",
    "build",
    "target",
    ".venv",
    "venv",
    ".idea",
    ".cursor",
    "novadiff-docs",
  ]);
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) {
      continue;
    }
    let entries = [];
    try {
      entries = fs.readdirSync(next.dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const abs = path.join(next.dir, entry.name);
      if (entry.isDirectory()) {
        if (next.depth < maxDepth && !skipDirs.has(entry.name)) {
          queue.push({ dir: abs, depth: next.depth + 1 });
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      files.add(abs);
    }
  }
  return files;
}

function detectEcosystems(projectRoot, allFiles) {
  /** @type {Array<{kind: string; manifest: string; cwd: string}>} */
  const targets = [];
  for (const abs of allFiles) {
    const base = path.basename(abs).toLowerCase();
    const cwd = path.dirname(abs);
    const rel = relPathFromRoot(projectRoot, abs) ?? base;
    if (base === "package.json") {
      targets.push({ kind: "node", manifest: rel, cwd });
      continue;
    }
    if (base === "requirements.txt" || base === "pyproject.toml" || base === "poetry.lock") {
      targets.push({ kind: "python", manifest: rel, cwd });
      continue;
    }
    if (base === "cargo.toml" || base === "cargo.lock") {
      targets.push({ kind: "rust", manifest: rel, cwd });
      continue;
    }
    if (base === "go.mod" || base === "go.sum") {
      targets.push({ kind: "go", manifest: rel, cwd });
      continue;
    }
    if (base === "gemfile" || base === "gemfile.lock") {
      targets.push({ kind: "ruby", manifest: rel, cwd });
      continue;
    }
    if (base === "pom.xml" || base === "build.gradle" || base === "build.gradle.kts") {
      targets.push({ kind: "jvm", manifest: rel, cwd });
    }
  }
  return targets;
}

function runCommand(bin, args, cwd, timeoutMs = 30000) {
  return spawnSync(
    process.platform === "win32" && !bin.endsWith(".cmd") ? `${bin}.cmd` : bin,
    args,
    {
      cwd,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
}

function parseNpmAudit(stdout) {
  const out = [];
  const raw = String(stdout ?? "").trim();
  if (!raw) {
    return out;
  }
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return out;
  }
  const vulnerabilities = data?.vulnerabilities;
  if (!vulnerabilities || typeof vulnerabilities !== "object") {
    return out;
  }
  for (const [pkg, details] of Object.entries(vulnerabilities)) {
    if (!details || typeof details !== "object") {
      continue;
    }
    const severity = severityFromAdvisory(details.severity);
    const via = Array.isArray(details.via) ? details.via : [];
    const advisory = via.find((item) => item && typeof item === "object") ?? null;
    const title = advisory?.title
      ? String(advisory.title)
      : `Vulnerability reported for package \`${pkg}\``;
    const advisoryId = advisory?.url
      ? String(advisory.url)
      : advisory?.source
        ? String(advisory.source)
        : undefined;
    const evidence = [
      details.range ? `Affected range: ${String(details.range)}` : null,
      details.fixAvailable ? "Fix is available from npm audit metadata." : null,
      advisory?.url ? `Reference: ${String(advisory.url)}` : null,
    ].filter(Boolean);
    out.push({
      id: `advisory:dependency-cve:${String(pkg).toLowerCase()}:${severity}`,
      source: "advisory",
      category: "dependency-cve",
      severity,
      confidence: "high",
      title,
      rel_path: "package.json",
      evidence,
      advisory: {
        ecosystem: "npm",
        packageName: String(pkg),
        advisoryId,
      },
    });
  }
  return out;
}

function parsePipAudit(stdout, relManifest) {
  const out = [];
  const raw = String(stdout ?? "").trim();
  if (!raw) {
    return out;
  }
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return out;
  }
  const deps = Array.isArray(data?.dependencies) ? data.dependencies : [];
  for (const dep of deps) {
    const name = String(dep?.name ?? "").trim();
    if (!name) {
      continue;
    }
    const vulns = Array.isArray(dep?.vulns) ? dep.vulns : [];
    for (const vuln of vulns) {
      const advId = String(vuln?.id ?? "").trim();
      const severity = severityFromAdvisory(vuln?.severity ?? "high");
      out.push({
        id: `advisory:dependency-cve:${hashId(["pypi", name, advId || vuln?.description])}`,
        source: "advisory",
        category: "dependency-cve",
        severity,
        confidence: confidenceFromSeverity(severity),
        title: advId
          ? `${name} affected by ${advId}`
          : `Vulnerability reported for Python package \`${name}\``,
        rel_path: relManifest ?? "requirements.txt",
        evidence: [
          vuln?.description ? String(vuln.description) : null,
          Array.isArray(vuln?.fix_versions) && vuln.fix_versions.length > 0
            ? `Fix versions: ${vuln.fix_versions.join(", ")}`
            : null,
        ].filter(Boolean),
        advisory: {
          ecosystem: "PyPI",
          packageName: name,
          advisoryId: advId || undefined,
        },
      });
    }
  }
  return out;
}

function parseCargoAudit(stdout, relManifest) {
  const out = [];
  const raw = String(stdout ?? "").trim();
  if (!raw) {
    return out;
  }
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return out;
  }
  const list = Array.isArray(data?.vulnerabilities?.list) ? data.vulnerabilities.list : [];
  for (const item of list) {
    const pkg = item?.package?.name ? String(item.package.name) : "crate";
    const adv = item?.advisory ?? {};
    const advId = String(adv.id ?? "").trim();
    const severity = severityFromAdvisory(adv.severity ?? "high");
    out.push({
      id: `advisory:dependency-cve:${hashId(["cargo", pkg, advId || adv.title])}`,
      source: "advisory",
      category: "dependency-cve",
      severity,
      confidence: confidenceFromSeverity(severity),
      title: adv.title
        ? String(adv.title)
        : advId
          ? `${pkg} affected by ${advId}`
          : `Vulnerability reported for crate \`${pkg}\``,
      rel_path: relManifest ?? "Cargo.lock",
      evidence: [
        advId ? `Advisory: ${advId}` : null,
        adv.url ? `Reference: ${String(adv.url)}` : null,
      ].filter(Boolean),
      advisory: {
        ecosystem: "crates.io",
        packageName: pkg,
        advisoryId: advId || undefined,
      },
    });
  }
  return out;
}

function parseOsvScanner(stdout) {
  const out = [];
  const raw = String(stdout ?? "").trim();
  if (!raw) {
    return out;
  }
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return out;
  }
  const results = Array.isArray(data?.results) ? data.results : [];
  for (const result of results) {
    const packages = Array.isArray(result?.packages) ? result.packages : [];
    for (const pkgEntry of packages) {
      const pkg = pkgEntry?.package ?? {};
      const name = String(pkg?.name ?? "").trim();
      const ecosystem = String(pkg?.ecosystem ?? "unknown").trim();
      const vulns = Array.isArray(pkgEntry?.vulnerabilities) ? pkgEntry.vulnerabilities : [];
      for (const vuln of vulns) {
        const advId = String(vuln?.id ?? "").trim();
        const severity = severityFromAdvisory(vuln?.database_specific?.severity ?? "high");
        out.push({
          id: `advisory:dependency-cve:${hashId([ecosystem, name, advId || vuln?.summary])}`,
          source: "advisory",
          category: "dependency-cve",
          severity,
          confidence: confidenceFromSeverity(severity),
          title: vuln?.summary
            ? String(vuln.summary)
            : advId
              ? `${name} affected by ${advId}`
              : `OSV vulnerability reported for \`${name || "dependency"}\``,
          rel_path: null,
          evidence: [
            advId ? `Advisory: ${advId}` : null,
            vuln?.details ? String(vuln.details).slice(0, 220) : null,
          ].filter(Boolean),
          advisory: {
            ecosystem,
            packageName: name || undefined,
            advisoryId: advId || undefined,
          },
        });
      }
    }
  }
  return out;
}

/**
 * @param {{
 * projectRoot: string;
 * advisoryEnabled?: boolean;
 * }} payload
 */
function runSecurityInsightScan(payload) {
  const projectRoot = path.resolve(String(payload?.projectRoot ?? "").trim());
  const advisoryEnabled = Boolean(payload?.advisoryEnabled);
  if (!projectRoot || !fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
    throw new Error("Invalid projectRoot for security scan");
  }

  /** @type {import("../src/app/types").RiskSignal[]} */
  const signals = [];
  /** @type {Array<{source: string; state: "ok"|"warning"|"error"|"skipped"; message: string; durationMs?: number}>} */
  const sources = [];

  if (!advisoryEnabled) {
    sources.push({
      source: "advisory",
      state: "skipped",
      message: "Advisory scan is disabled.",
    });
    return {
      scannedAt: new Date().toISOString(),
      signals,
      sources,
    };
  }
  const markerFiles = walkRepoForMarkers(projectRoot, 7);
  const ecosystems = detectEcosystems(projectRoot, markerFiles);
  const hasKind = (kind) => ecosystems.some((entry) => entry.kind === kind);

  // 1) Universal scan when available
  {
    const start = Date.now();
    const result = runCommand("osv-scanner", ["--recursive", "--format", "json", "."], projectRoot, 45000);
    const durationMs = Date.now() - start;
    if (result.error) {
      sources.push({
        source: "osv-scanner",
        state: "warning",
        message: "OSV scanner not available on PATH.",
        durationMs,
      });
    } else {
      const parsed = parseOsvScanner(result.stdout);
      parsed.forEach((item) => signals.push(item));
      const exitCode = typeof result.status === "number" ? result.status : 0;
      if (exitCode !== 0 && parsed.length === 0) {
        sources.push({
          source: "osv-scanner",
          state: "warning",
          message: String(result.stderr ?? "").trim() || `Exited with code ${exitCode}`,
          durationMs,
        });
      } else {
        sources.push({
          source: "osv-scanner",
          state: "ok",
          message: parsed.length > 0
            ? `Found ${parsed.length} advisory finding(s).`
            : "No OSV findings detected.",
          durationMs,
        });
      }
    }
  }

  // 2) Node scanner
  if (hasKind("node")) {
    const targets = ecosystems.filter((entry) => entry.kind === "node");
    const target = targets[0];
    const start = Date.now();
    const result = runCommand("npm", ["audit", "--json", "--audit-level=moderate"], target.cwd, 35000);
    const durationMs = Date.now() - start;
    if (result.error) {
      sources.push({
        source: "npm-audit",
        state: "warning",
        message: result.error.message,
        durationMs,
      });
    } else {
      const parsed = parseNpmAudit(result.stdout);
      parsed.forEach((item) => {
        if (target.manifest) {
          item.rel_path = target.manifest;
        }
        signals.push(item);
      });
      const exitCode = typeof result.status === "number" ? result.status : 0;
      if (exitCode > 1 && parsed.length === 0) {
        sources.push({
          source: "npm-audit",
          state: "error",
          message: String(result.stderr ?? "").trim() || `Exited with code ${exitCode}`,
          durationMs,
        });
      } else {
        sources.push({
          source: "npm-audit",
          state: "ok",
          message: parsed.length > 0
            ? `Found ${parsed.length} npm advisory finding(s).`
            : "No npm advisory findings detected.",
          durationMs,
        });
      }
    }
  } else {
    sources.push({
      source: "npm-audit",
      state: "skipped",
      message: "No Node manifest detected.",
    });
  }

  // 3) Python scanner
  if (hasKind("python")) {
    const target = ecosystems.find((entry) => entry.kind === "python");
    const start = Date.now();
    const result = runCommand("pip-audit", ["-f", "json"], target.cwd, 35000);
    const durationMs = Date.now() - start;
    if (result.error) {
      sources.push({
        source: "pip-audit",
        state: "warning",
        message: "pip-audit not available on PATH.",
        durationMs,
      });
    } else {
      const parsed = parsePipAudit(result.stdout, target.manifest);
      parsed.forEach((item) => signals.push(item));
      sources.push({
        source: "pip-audit",
        state: "ok",
        message: parsed.length > 0
          ? `Found ${parsed.length} Python advisory finding(s).`
          : "No Python advisory findings detected.",
        durationMs,
      });
    }
  } else {
    sources.push({
      source: "pip-audit",
      state: "skipped",
      message: "No Python manifest detected.",
    });
  }

  // 4) Rust scanner
  if (hasKind("rust")) {
    const target = ecosystems.find((entry) => entry.kind === "rust");
    const start = Date.now();
    const result = runCommand("cargo", ["audit", "--json"], target.cwd, 45000);
    const durationMs = Date.now() - start;
    if (result.error) {
      sources.push({
        source: "cargo-audit",
        state: "warning",
        message: "cargo-audit not available (install via `cargo install cargo-audit`).",
        durationMs,
      });
    } else {
      const parsed = parseCargoAudit(result.stdout, target.manifest);
      parsed.forEach((item) => signals.push(item));
      sources.push({
        source: "cargo-audit",
        state: "ok",
        message: parsed.length > 0
          ? `Found ${parsed.length} Rust advisory finding(s).`
          : "No Rust advisory findings detected.",
        durationMs,
      });
    }
  } else {
    sources.push({
      source: "cargo-audit",
      state: "skipped",
      message: "No Rust manifest detected.",
    });
  }

  // 5) Go scanner status (placeholder)
  if (hasKind("go")) {
    const start = Date.now();
    const result = runCommand("govulncheck", ["-json", "./..."], projectRoot, 45000);
    const durationMs = Date.now() - start;
    if (result.error) {
      sources.push({
        source: "govulncheck",
        state: "warning",
        message: "govulncheck not available on PATH.",
        durationMs,
      });
    } else {
      sources.push({
        source: "govulncheck",
        state: "ok",
        message: "Go vulnerability scan executed (JSON parser integration pending).",
        durationMs,
      });
    }
  } else {
    sources.push({
      source: "govulncheck",
      state: "skipped",
      message: "No Go manifest detected.",
    });
  }

  // 6) Ruby scanner status
  if (hasKind("ruby")) {
    const start = Date.now();
    const result = runCommand("bundle-audit", ["check", "--update"], projectRoot, 45000);
    const durationMs = Date.now() - start;
    if (result.error) {
      sources.push({
        source: "bundle-audit",
        state: "warning",
        message: "bundle-audit not available on PATH.",
        durationMs,
      });
    } else {
      const output = `${String(result.stdout ?? "")}\n${String(result.stderr ?? "")}`;
      const hasVuln = /vulnerab/i.test(output);
      if (hasVuln) {
        signals.push({
          id: `advisory:dependency-cve:${hashId(["ruby", output.slice(0, 120)])}`,
          source: "advisory",
          category: "dependency-cve",
          severity: "medium",
          confidence: "medium",
          title: "Ruby dependency vulnerabilities reported by bundle-audit",
          rel_path: "Gemfile.lock",
          evidence: [output.split("\n").slice(0, 3).join(" ").trim()],
          advisory: {
            ecosystem: "RubyGems",
          },
        });
      }
      sources.push({
        source: "bundle-audit",
        state: "ok",
        message: hasVuln
          ? "Ruby advisories were reported."
          : "No Ruby advisories reported.",
        durationMs,
      });
    }
  } else {
    sources.push({
      source: "bundle-audit",
      state: "skipped",
      message: "No Ruby manifest detected.",
    });
  }

  if (hasKind("jvm")) {
    sources.push({
      source: "jvm-advisory",
      state: "warning",
      message: "JVM manifests detected. Add OWASP dependency-check or osv-scanner full parse for Java/Kotlin advisories.",
    });
  }

  // Deduplicate signal ids across scanners.
  const deduped = new Map();
  for (const item of signals) {
    if (item?.id) {
      deduped.set(item.id, item);
    }
  }

  return {
    scannedAt: new Date().toISOString(),
    signals: [...deduped.values()],
    sources,
  };
}

module.exports = {
  runSecurityInsightScan,
};
