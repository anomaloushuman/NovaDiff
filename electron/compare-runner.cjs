"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function cliExecutableName() {
  return process.platform === "win32" ? "novadiff-cli.exe" : "novadiff-cli";
}

/**
 * @param {string} appRoot `app.getAppPath()` (dev: project root; packaged: .asar path or app dir)
 * @param {boolean} isPackaged
 */
function resolveRustCli(appRoot, isPackaged) {
  const name = cliExecutableName();

  if (process.env.NOVADIFF_CLI && fs.existsSync(process.env.NOVADIFF_CLI)) {
    return process.env.NOVADIFF_CLI;
  }

  if (isPackaged) {
    const rp = process.resourcesPath;
    if (rp) {
      const a = path.join(rp, name);
      if (fs.existsSync(a)) return a;
      const b = path.join(rp, "bin", name);
      if (fs.existsSync(b)) return b;
    }
    const c = path.join(appRoot, name);
    if (fs.existsSync(c)) return c;
  }

  const release = path.join(appRoot, "cli", "target", "release", name);
  if (fs.existsSync(release)) return release;
  const debug = path.join(appRoot, "cli", "target", "debug", name);
  if (fs.existsSync(debug)) return debug;

  return null;
}

function cleanEnv() {
  const env = { ...process.env };
  delete env.ELECTRON_OVERRIDE_DIST_PATH;
  delete env.ELECTRON_RUN_AS_NODE;
  return env;
}

/**
 * @param {string} appRoot
 * @param {object} message JSON payload (same shape as former Node compare-cli)
 * @param {boolean} isPackaged
 */
function runCompareEngine(appRoot, message, isPackaged) {
  const bin = resolveRustCli(appRoot, isPackaged);
  if (!bin) {
    throw new Error(
      "Rust engine binary not found. Run: npm run rust:build (or cargo build --release --manifest-path cli/Cargo.toml). Optional: set NOVADIFF_CLI to the full path of novadiff-cli.",
    );
  }

  const result = spawnSync(bin, [], {
    cwd: appRoot,
    input: JSON.stringify(message),
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
    env: cleanEnv(),
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const err =
      (result.stderr && result.stderr.trim()) || "Compare engine failed";
    throw new Error(err);
  }
  if (!result.stdout) {
    throw new Error("Compare engine returned no output");
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error("Compare engine returned invalid JSON");
  }
}

module.exports = { runCompareEngine, resolveRustCli };
