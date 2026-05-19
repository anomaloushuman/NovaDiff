"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

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

function parseEngineStdout(stdout) {
  if (!stdout || !String(stdout).trim()) {
    throw new Error("Compare engine returned no output");
  }
  try {
    return JSON.parse(String(stdout));
  } catch {
    throw new Error("Compare engine returned invalid JSON");
  }
}

/**
 * Non-blocking compare engine run with heartbeat progress (keeps Electron IPC responsive).
 * @param {(progress: object) => void} [onProgress]
 */
function runCompareEngineAsync(appRoot, message, isPackaged, onProgress) {
  const bin = resolveRustCli(appRoot, isPackaged);
  if (!bin) {
    return Promise.reject(
      new Error(
        "Rust engine binary not found. Run: npm run rust:build (or cargo build --release --manifest-path cli/Cargo.toml). Optional: set NOVADIFF_CLI to the full path of novadiff-cli.",
      ),
    );
  }

  const cmd = String(message?.cmd ?? "engine");
  const startedAt = Date.now();
  let bytesReceived = 0;

  const emit = (phase, detail, extra = {}) => {
    if (typeof onProgress === "function") {
      onProgress({
        cmd,
        phase,
        message: detail,
        elapsedMs: Date.now() - startedAt,
        bytesReceived,
        ...extra,
      });
    }
  };

  return new Promise((resolve, reject) => {
    emit("spawn", "Starting compare engine…");

    const child = spawn(bin, [], {
      cwd: appRoot,
      env: cleanEnv(),
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (err, value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearInterval(heartbeat);
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    };

    const heartbeat = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt) / 1000);
      const mb = (bytesReceived / (1024 * 1024)).toFixed(1);
      const sizeHint =
        bytesReceived > 64 * 1024 ? ` · ${mb} MB received` : "";
      emit("running", `Engine working… ${sec}s${sizeHint}`);
    }, 450);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      bytesReceived = Buffer.byteLength(stdout, "utf8");
      if (bytesReceived > 256 * 1024) {
        emit("running", "Receiving large result set…", { bytesReceived });
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      finish(err);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        const errText = stderr.trim() || "Compare engine failed";
        finish(new Error(errText));
        return;
      }
      emit("parsing", "Parsing results…");
      setImmediate(() => {
        try {
          const parsed = parseEngineStdout(stdout);
          emit("done", "Complete");
          finish(null, parsed);
        } catch (e) {
          finish(e instanceof Error ? e : new Error(String(e)));
        }
      });
    });

    try {
      child.stdin.write(JSON.stringify(message));
      child.stdin.end();
    } catch (e) {
      finish(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

module.exports = {
  runCompareEngine,
  runCompareEngineAsync,
  resolveRustCli,
};
