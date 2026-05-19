"use strict";

/**
 * Dev launcher: spawns the Electron *binary* from this repo’s
 * `node_modules/electron/dist/` only. Does not use `electron/cli.js` (which
 * loads `index.js` and can honor `ELECTRON_OVERRIDE_DIST_PATH`, pointing at
 * another project’s broken `Electron.app` / asar).
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const electronPkg = path.join(root, "node_modules", "electron");
const pathFile = path.join(electronPkg, "path.txt");

function cleanEnv() {
  const { augmentPathForCli } = require(path.join(root, "electron", "gh-path.cjs"));
  const env = augmentPathForCli({ ...process.env });
  delete env.ELECTRON_OVERRIDE_DIST_PATH;
  return env;
}

function resolveElectronBinary() {
  if (!fs.existsSync(pathFile)) {
    throw new Error(
      `Missing ${pathFile}. Run npm install in ${root} so the electron package downloads its binary.`,
    );
  }
  const rel = fs.readFileSync(pathFile, "utf8").trim();
  if (!rel) {
    throw new Error(`Empty ${pathFile}; reinstall the electron package.`);
  }
  const binary = path.join(electronPkg, "dist", rel);
  if (!fs.existsSync(binary)) {
    throw new Error(
      `Electron binary not found at ${binary}. Delete node_modules/electron and run npm install again.`,
    );
  }
  return binary;
}

const binary = resolveElectronBinary();
const args = process.argv.slice(2);
if (args.length === 0) {
  args.push(".");
}

const child = spawn(binary, args, {
  cwd: root,
  stdio: "inherit",
  env: cleanEnv(),
});

child.on("error", (err) => {
  console.error(err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
