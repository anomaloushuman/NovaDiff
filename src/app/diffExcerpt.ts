import type { FileDiffPayload } from "./types";

/**
 * NovaDiff assumes high-context local models by default (128k+/256k class), so file
 * summaries should prefer fewer, larger passes rather than hundreds of tiny calls.
 */
export const FILE_SUMMARY_DIFF_CHUNK_CHARS = 48_000;
export const FILE_SUMMARY_MAX_CHUNKS = 8;

function formatDiffRowLine(row: FileDiffPayload["rows"][number]): string {
  return `${row.left_no ?? ""}\t${row.right_no ?? ""}\t${row.left_style}\t${row.left.slice(0, 160)}\t${row.right.slice(0, 160)}\n`;
}

/** Compact diff text for LLM context (bounded size; stops early). */
export function buildDiffExcerpt(
  payload: FileDiffPayload | null,
  maxLen = 24_000,
): string | undefined {
  if (!payload?.rows?.length) {
    return undefined;
  }
  const parts: string[] = [];
  let len = 0;
  for (let i = 0; i < payload.rows.length; i++) {
    const row = payload.rows[i];
    const line = formatDiffRowLine(row);
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
 * Full diff as multiple excerpts (each under ~maxLenPerChunk chars) for multi-pass
 * LLM summarization on large files.
 */
export function buildDiffExcerptChunks(
  payload: FileDiffPayload | null,
  maxLenPerChunk = FILE_SUMMARY_DIFF_CHUNK_CHARS,
  maxChunks = FILE_SUMMARY_MAX_CHUNKS,
): string[] {
  if (!payload?.rows?.length) {
    return [];
  }
  const lines = payload.rows.map((row) => formatDiffRowLine(row));
  const totalLen = lines.reduce((sum, line) => sum + line.length, 0);
  const effectiveMaxLen =
    maxChunks > 0 ? Math.max(maxLenPerChunk, Math.ceil(totalLen / maxChunks)) : maxLenPerChunk;
  const chunks: string[] = [];
  let parts: string[] = [];
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
