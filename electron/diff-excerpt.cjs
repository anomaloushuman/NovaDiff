"use strict";

const FILE_SUMMARY_DIFF_CHUNK_CHARS = 48_000;
const FILE_SUMMARY_MAX_CHUNKS = 8;

/**
 * Same logic as `src/app/diffExcerpt.ts` — compact diff text for LLM context.
 * @param {{ rows?: { left_no?: unknown; right_no?: unknown; left_style?: string; left?: string; right?: string }[] }} payload
 * @param {number} [maxLen]
 * @returns {string | undefined}
 */
function buildDiffExcerpt(payload, maxLen = 24_000) {
  if (!payload?.rows?.length) {
    return undefined;
  }
  const parts = [];
  let len = 0;
  for (let i = 0; i < payload.rows.length; i++) {
    const row = payload.rows[i];
    const line = `${row.left_no ?? ""}\t${row.right_no ?? ""}\t${row.left_style}\t${String(row.left).slice(0, 160)}\t${String(row.right).slice(0, 160)}\n`;
    if (len + line.length > maxLen) {
      break;
    }
    parts.push(line);
    len += line.length;
  }
  const s = parts.join("");
  return s.length > 0 ? s : undefined;
}

/**
 * @param {{ rows?: { left_no?: unknown; right_no?: unknown; left_style?: string; left?: string; right?: string }[] }} payload
 * @param {number} [maxLenPerChunk]
 * @returns {string[]}
 */
function buildDiffExcerptChunks(
  payload,
  maxLenPerChunk = FILE_SUMMARY_DIFF_CHUNK_CHARS,
  maxChunks = FILE_SUMMARY_MAX_CHUNKS,
) {
  if (!payload?.rows?.length) {
    return [];
  }
  const lines = payload.rows.map(
    (row) =>
      `${row.left_no ?? ""}\t${row.right_no ?? ""}\t${row.left_style}\t${String(row.left).slice(0, 160)}\t${String(row.right).slice(0, 160)}\n`,
  );
  const totalLen = lines.reduce((sum, line) => sum + line.length, 0);
  const effectiveMaxLen =
    maxChunks > 0 ? Math.max(maxLenPerChunk, Math.ceil(totalLen / maxChunks)) : maxLenPerChunk;
  const chunks = [];
  let parts = [];
  let len = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (len + line.length > effectiveMaxLen && parts.length > 0) {
      chunks.push(parts.join(""));
      parts = [];
      len = 0;
    }
    parts.push(line);
    len += line.length;
  }
  if (parts.length > 0) {
    chunks.push(parts.join(""));
  }
  return chunks;
}

module.exports = { buildDiffExcerpt, buildDiffExcerptChunks };
