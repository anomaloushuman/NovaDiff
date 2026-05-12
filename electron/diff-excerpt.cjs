"use strict";

/**
 * Same logic as `src/app/diffExcerpt.ts` — compact diff text for LLM context.
 * @param {{ rows?: { left_no?: unknown; right_no?: unknown; left_style?: string; left?: string; right?: string }[] }} payload
 * @param {number} [maxLen]
 * @returns {string | undefined}
 */
function buildDiffExcerpt(payload, maxLen = 8000) {
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

module.exports = { buildDiffExcerpt };
