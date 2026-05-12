import type { FileDiffPayload } from "./types";

/** Compact diff text for LLM context (bounded size). */
export function buildDiffExcerpt(
  payload: FileDiffPayload | null,
  maxLen = 8000,
): string | undefined {
  if (!payload?.rows?.length) {
    return undefined;
  }
  const parts: string[] = [];
  let len = 0;
  for (let i = 0; i < payload.rows.length; i++) {
    const row = payload.rows[i];
    const line = `${row.left_no ?? ""}\t${row.right_no ?? ""}\t${row.left_style}\t${row.left.slice(0, 160)}\t${row.right.slice(0, 160)}\n`;
    if (len + line.length > maxLen) {
      break;
    }
    parts.push(line);
    len += line.length;
  }
  const s = parts.join("");
  return s.length > 0 ? s : undefined;
}
