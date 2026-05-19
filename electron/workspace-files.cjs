"use strict";

const fssync = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "target",
  ".novadiff-graph",
  "snapshots",
]);

async function listSnapshotFiles(snapshotRoot, opts = {}) {
  const root = path.resolve(String(snapshotRoot ?? "").trim());
  const maxFiles = opts.maxFiles ?? 2500;
  const files = [];
  if (!root || !fssync.existsSync(root)) {
    return files;
  }

  async function walk(dir, prefix) {
    if (files.length >= maxFiles) {
      return;
    }
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (files.length >= maxFiles) {
        break;
      }
      if (ent.name.startsWith(".") && ent.name !== ".env") {
        if (ent.name === ".git") {
          continue;
        }
      }
      const rel = prefix ? `${prefix}/${ent.name}` : ent.name;
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) {
          continue;
        }
        await walk(abs, rel);
      } else if (ent.isFile()) {
        files.push(rel.replace(/\\/g, "/"));
      }
    }
  }

  await walk(root, "");
  return files.sort((a, b) => a.localeCompare(b));
}

async function readSnapshotTextFile(snapshotRoot, relPath, maxBytes = 512 * 1024) {
  const root = path.resolve(String(snapshotRoot ?? "").trim());
  const rel = String(relPath ?? "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!root || !rel || rel.includes("..")) {
    throw new Error("Invalid file path");
  }
  const abs = path.join(root, rel);
  if (!abs.startsWith(root)) {
    throw new Error("Invalid file path");
  }
  const buf = await fsp.readFile(abs);
  if (buf.length > maxBytes) {
    return {
      content: buf.slice(0, maxBytes).toString("utf8"),
      truncated: true,
      size: buf.length,
    };
  }
  return { content: buf.toString("utf8"), truncated: false, size: buf.length };
}

module.exports = {
  listSnapshotFiles,
  readSnapshotTextFile,
};
