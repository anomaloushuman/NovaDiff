"use strict";

const fssync = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

/** @type {string | null} */
let cachedGhPath = null;

function homeDir() {
  return process.env.HOME || os.homedir();
}

function extraPathDirs() {
  const home = homeDir();
  const dirs = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    path.join(home, ".local", "bin"),
    path.join(home, "bin"),
  ];
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA;
    if (local) {
      dirs.unshift(path.join(local, "GitHub CLI"));
    }
  }
  return dirs;
}

/**
 * Merge Homebrew / user bin dirs into PATH (GUI apps on macOS often miss these).
 * @param {NodeJS.ProcessEnv} [base]
 */
function augmentPathForCli(base = process.env) {
  const delim = path.delimiter;
  const parts = String(base.PATH || "").split(delim).filter(Boolean);
  const merged = [...extraPathDirs(), ...parts];
  const seen = new Set();
  const PATH = merged.filter((p) => {
    if (!p || seen.has(p)) {
      return false;
    }
    seen.add(p);
    return true;
  });
  return { ...base, PATH: PATH.join(delim) };
}

function ghCandidatePaths() {
  const home = homeDir();
  return [
    path.join("/opt/homebrew/bin", "gh"),
    path.join("/usr/local/bin", "gh"),
    path.join(home, ".local", "bin", "gh"),
    path.join(home, "bin", "gh"),
  ];
}

function resolveViaLoginShell(env) {
  if (process.platform === "win32") {
    return null;
  }
  const shells = [
    ["/bin/zsh", ["-ilc", "command -v gh"]],
    ["/bin/bash", ["-lc", "command -v gh"]],
  ];
  for (const [shell, args] of shells) {
    if (!fssync.existsSync(shell)) {
      continue;
    }
    try {
      const res = spawnSync(shell, args, {
        encoding: "utf8",
        env,
        timeout: 8000,
      });
      const found = (res.stdout || "").trim().split("\n")[0]?.trim();
      if (found && fssync.existsSync(found)) {
        return found;
      }
    } catch {
      /* try next shell */
    }
  }
  return null;
}

function verifyGh(binary, env) {
  const res = spawnSync(binary, ["--version"], {
    encoding: "utf8",
    env,
    timeout: 8000,
  });
  return !res.error && res.status === 0;
}

/**
 * Resolve absolute path to `gh`, or bare name if unknown.
 */
function resolveGhExecutable() {
  if (cachedGhPath) {
    return cachedGhPath;
  }
  const env = augmentPathForCli();

  for (const candidate of ghCandidatePaths()) {
    if (fssync.existsSync(candidate)) {
      cachedGhPath = candidate;
      return candidate;
    }
  }

  const fromShell = resolveViaLoginShell(env);
  if (fromShell) {
    cachedGhPath = fromShell;
    return fromShell;
  }

  try {
    const whichBin = process.platform === "win32" ? "where" : "which";
    const whichArgs = process.platform === "win32" ? ["gh"] : ["gh"];
    const res = spawnSync(whichBin, whichArgs, { encoding: "utf8", env, timeout: 5000 });
    const found = (res.stdout || "").trim().split(/\r?\n/)[0]?.trim();
    if (found && fssync.existsSync(found)) {
      cachedGhPath = found;
      return found;
    }
  } catch {
    /* ignore */
  }

  cachedGhPath = process.platform === "win32" ? "gh.exe" : "gh";
  return cachedGhPath;
}

function clearGhCache() {
  cachedGhPath = null;
}

function isGhInstalled() {
  const gh = resolveGhExecutable();
  if (gh !== "gh" && gh !== "gh.exe") {
    return verifyGh(gh, augmentPathForCli());
  }
  return verifyGh(gh, augmentPathForCli());
}

function ghInstallHint() {
  if (process.platform === "darwin") {
    return "Install GitHub CLI: brew install gh — then run gh auth login in Terminal, or use Sign in with GitHub here.";
  }
  if (process.platform === "win32") {
    return "Install GitHub CLI from https://cli.github.com/ (winget install GitHub.cli)";
  }
  return "Install GitHub CLI from https://cli.github.com/";
}

function ghNotFoundError() {
  return new Error(`GitHub CLI (gh) was not found. ${ghInstallHint()}`);
}

module.exports = {
  augmentPathForCli,
  resolveGhExecutable,
  clearGhCache,
  isGhInstalled,
  ghInstallHint,
  ghNotFoundError,
};
