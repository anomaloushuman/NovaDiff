"use strict";

const { spawn } = require("node:child_process");
const { shell } = require("electron");
const {
  augmentPathForCli,
  resolveGhExecutable,
  isGhInstalled,
  ghNotFoundError,
} = require("./gh-path.cjs");

const VERIFICATION_URI = "https://github.com/login/device";
const CODE_RE = /(?:one-time code:\s*)?([A-Z0-9]{4}-[A-Z0-9]{4})/i;

let activeLogin = null;

function stripAnsi(text) {
  return String(text).replace(/\x1B\[[0-9;?]*[ -/]*[@-~]/g, "");
}

function cancelGithubDeviceAuth() {
  if (!activeLogin) {
    return;
  }
  try {
    activeLogin.child.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  activeLogin = null;
}

/**
 * Runs `gh auth login` and surfaces the device code to the renderer before opening GitHub.
 * @param {(msg: object) => void} emit
 * @returns {Promise<{ userCode: string; verificationUri: string }>}
 */
function startGithubDeviceAuth(emit) {
  cancelGithubDeviceAuth();

  if (!isGhInstalled()) {
    const err = ghNotFoundError();
    emit({ phase: "error", message: err.message });
    return Promise.reject(err);
  }

  const gh = resolveGhExecutable();
  const env = augmentPathForCli({ ...process.env, NO_COLOR: "1", CLICOLOR: "0" });

  return new Promise((resolve, reject) => {
    const child = spawn(
      gh,
      ["auth", "login", "--hostname", "github.com", "--git-protocol", "https", "--skip-ssh-key"],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env,
      },
    );

    let settled = false;
    let buffer = "";
    let codeEmitted = false;

    const fail = (message) => {
      if (!settled) {
        settled = true;
        cancelGithubDeviceAuth();
        reject(new Error(message));
      }
      emit({ phase: "error", message });
    };

    const timeout = setTimeout(() => {
      fail(
        "Timed out waiting for a sign-in code. Install GitHub CLI (gh) and try again, or run: gh auth login",
      );
    }, 90_000);

    const onChunk = (chunk) => {
      buffer += stripAnsi(chunk.toString());
      if (codeEmitted) {
        return;
      }
      const match = buffer.match(CODE_RE);
      if (!match) {
        return;
      }
      codeEmitted = true;
      const userCode = match[1].toUpperCase();
      emit({ phase: "code", userCode, verificationUri: VERIFICATION_URI });
      if (!settled) {
        settled = true;
        resolve({ userCode, verificationUri: VERIFICATION_URI });
      }
      void shell.openExternal(VERIFICATION_URI);
      try {
        child.stdin.write("\n");
      } catch {
        /* stdin may already be closed */
      }
    };

    child.stdout.on("data", onChunk);
    child.stderr.on("data", onChunk);

    child.on("error", (err) => {
      clearTimeout(timeout);
      if (err.code === "ENOENT") {
        fail(ghNotFoundError().message);
        return;
      }
      fail(err.message || String(err));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      activeLogin = null;
      if (code === 0) {
        emit({ phase: "complete" });
        return;
      }
      if (!codeEmitted) {
        const fallback = `gh auth login failed (exit ${code})`;
        fail((buffer.trim() || fallback).slice(0, 500));
        return;
      }
      emit({
        phase: "error",
        message: `GitHub sign-in did not finish (exit ${code}). Try again.`,
      });
    });

    activeLogin = { child };
  });
}

module.exports = {
  startGithubDeviceAuth,
  cancelGithubDeviceAuth,
  VERIFICATION_URI,
};
