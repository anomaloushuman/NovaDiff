"use strict";

const { spawn } = require("node:child_process");
const fssync = require("node:fs");
const {
  augmentPathForCli,
  resolveGhExecutable,
  isGhInstalled,
  clearGhCache,
} = require("./gh-path.cjs");

const GH_FEATURE_REASON =
  "GitHub CLI (gh) lets NovaDiff sign you in securely, list repositories, open pull requests, and index commit history for semantic diffs across your project timeline.";

function resolveBrew() {
  const candidates = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
  for (const p of candidates) {
    if (fssync.existsSync(p)) {
      return p;
    }
  }
  const env = augmentPathForCli();
  try {
    const { spawnSync } = require("node:child_process");
    const res = spawnSync("/bin/bash", ["-lc", "command -v brew"], {
      encoding: "utf8",
      env,
      timeout: 8000,
    });
    const found = (res.stdout || "").trim().split("\n")[0]?.trim();
    if (found && fssync.existsSync(found)) {
      return found;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function getInstallPlan() {
  if (process.platform === "darwin") {
    const brew = resolveBrew();
    if (brew) {
      return {
        canAutoInstall: true,
        method: "homebrew",
        command: `${brew} install gh`,
        label: "Install with Homebrew",
        manualUrl: "https://cli.github.com/",
      };
    }
    return {
      canAutoInstall: false,
      method: null,
      command: null,
      label: null,
      manualUrl: "https://cli.github.com/",
      manualHint:
        "Install Homebrew from https://brew.sh/ or download GitHub CLI from https://cli.github.com/",
    };
  }
  if (process.platform === "win32") {
    return {
      canAutoInstall: true,
      method: "winget",
      command: "winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements",
      label: "Install with winget",
      manualUrl: "https://cli.github.com/",
    };
  }
  return {
    canAutoInstall: false,
    method: null,
    command: null,
    label: null,
    manualUrl: "https://cli.github.com/",
    manualHint: "Install gh using your package manager (e.g. apt install gh).",
  };
}

function readGhVersion() {
  if (!isGhInstalled()) {
    return null;
  }
  const { spawnSync } = require("node:child_process");
  const gh = resolveGhExecutable();
  const res = spawnSync(gh, ["--version"], {
    encoding: "utf8",
    env: augmentPathForCli(),
    timeout: 8000,
  });
  const line = (res.stdout || res.stderr || "").trim().split("\n")[0];
  return line || null;
}

function getGhToolingStatus() {
  const installed = isGhInstalled();
  const plan = getInstallPlan();
  return {
    installed,
    path: installed ? resolveGhExecutable() : null,
    version: installed ? readGhVersion() : null,
    canAutoInstall: plan.canAutoInstall,
    installMethod: plan.method,
    installCommand: plan.command,
    installLabel: plan.label,
    manualUrl: plan.manualUrl,
    manualHint: plan.manualHint ?? null,
    reason: GH_FEATURE_REASON,
  };
}

/**
 * @param {(line: string) => void} [onLog]
 */
function runInstallCommand(cmd, args, onLog) {
  return new Promise((resolve, reject) => {
    const env = augmentPathForCli();
    const child = spawn(cmd, args, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const append = (chunk) => {
      const text = String(chunk);
      for (const line of text.split(/\r?\n/)) {
        if (line.trim()) {
          onLog?.(line);
        }
      }
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", reject);
    child.on("close", (code) => {
      clearGhCache();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Install exited with code ${code}`));
      }
    });
  });
}

/**
 * @param {(line: string) => void} [onLog]
 */
async function installGh(onLog) {
  clearGhCache();
  const plan = getInstallPlan();
  if (!plan.canAutoInstall) {
    throw new Error(plan.manualHint || "Automatic install is not available on this system.");
  }

  onLog?.(`Starting: ${plan.command}`);

  if (plan.method === "homebrew") {
    const brew = resolveBrew();
    if (!brew) {
      throw new Error("Homebrew was not found. Install from https://brew.sh/");
    }
    await runInstallCommand(brew, ["install", "gh"], onLog);
  } else if (plan.method === "winget") {
    await runInstallCommand(
      "winget",
      [
        "install",
        "--id",
        "GitHub.cli",
        "-e",
        "--accept-source-agreements",
        "--accept-package-agreements",
      ],
      onLog,
    );
  }

  clearGhCache();
  if (!isGhInstalled()) {
    throw new Error(
      "Install finished but gh was not detected. Restart NovaDiff or install manually from https://cli.github.com/",
    );
  }

  return {
    ok: true,
    path: resolveGhExecutable(),
    version: readGhVersion(),
  };
}

module.exports = {
  GH_FEATURE_REASON,
  getGhToolingStatus,
  installGh,
};
