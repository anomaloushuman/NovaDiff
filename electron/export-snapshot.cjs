"use strict";

const fssync = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function exportProjectSnapshotZip(bundleDir, outZipPath) {
  const dir = path.resolve(String(bundleDir ?? "").trim());
  const out = path.resolve(String(outZipPath ?? "").trim());
  if (!dir || !fssync.existsSync(dir)) {
    throw new Error("Bundle directory not found");
  }
  fssync.mkdirSync(path.dirname(out), { recursive: true });
  if (fssync.existsSync(out)) {
    fssync.unlinkSync(out);
  }
  const res = spawnSync("zip", ["-r", "-q", out, "."], { cwd: dir, encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || "zip failed").trim());
  }
  return { zipPath: out, bytes: fssync.statSync(out).size };
}

module.exports = { exportProjectSnapshotZip };
