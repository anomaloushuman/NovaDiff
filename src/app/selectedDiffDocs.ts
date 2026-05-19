import type {
  DiffRow,
  DiffSelectionLineRange,
  DiffSelectionSymbolMatch,
  DiffSymbolSpan,
  FileDiffPayload,
  SelectionDocMode,
} from "./types";

const EXACT_CONTEXT_PADDING = 2;
const EXACT_SELECTION_EXCERPT_MAX = 10_000;
const EXPANDED_SELECTION_EXCERPT_MAX = 22_000;

function formatDiffRowLine(row: DiffRow): string {
  return `${row.left_no ?? ""}\t${row.right_no ?? ""}\t${row.left_style}\t${row.left.slice(0, 160)}\t${row.right.slice(0, 160)}\n`;
}

function compactIndices(indices: number[]): number[] {
  return Array.from(new Set(indices))
    .filter((value) => Number.isInteger(value) && value >= 0)
    .sort((a, b) => a - b);
}

function summarizeLineRange(
  values: Array<number | null>,
): { start: number | null; end: number | null } {
  const nums = values.filter((value): value is number => value != null);
  if (nums.length === 0) {
    return { start: null, end: null };
  }
  return { start: nums[0], end: nums[nums.length - 1] };
}

function lineRangeLabel(start: number | null, end: number | null, prefix: string): string | null {
  if (start == null) {
    return null;
  }
  if (end == null || end === start) {
    return `${prefix}${start}`;
  }
  return `${prefix}${start}-${end}`;
}

function buildExcerpt(rows: DiffRow[], maxLen: number): string | undefined {
  const parts: string[] = [];
  let len = 0;
  for (const row of rows) {
    const line = formatDiffRowLine(row);
    if (parts.length > 0 && len + line.length > maxLen) {
      break;
    }
    parts.push(line);
    len += line.length;
  }
  const out = parts.join("");
  return out.length > 0 ? out : undefined;
}

function getRowsForIndices(payload: FileDiffPayload, indices: number[]): DiffRow[] {
  return compactIndices(indices)
    .map((index) => payload.rows[index])
    .filter((row): row is DiffRow => Boolean(row));
}

function rowsForWindow(payload: FileDiffPayload, selected: number[], padding: number): DiffRow[] {
  const seen = new Set<number>();
  const ordered: number[] = [];
  for (const index of compactIndices(selected)) {
    const start = Math.max(0, index - padding);
    const end = Math.min(payload.rows.length - 1, index + padding);
    for (let i = start; i <= end; i++) {
      if (!seen.has(i)) {
        seen.add(i);
        ordered.push(i);
      }
    }
  }
  return ordered.map((index) => payload.rows[index]).filter(Boolean);
}

function buildLineRanges(payload: FileDiffPayload, selected: number[]): DiffSelectionLineRange[] {
  const ordered = compactIndices(selected);
  if (ordered.length === 0) {
    return [];
  }
  const ranges: Array<{ startRow: number; endRow: number }> = [];
  let rangeStart = ordered[0];
  let prev = ordered[0];
  for (let i = 1; i < ordered.length; i++) {
    const current = ordered[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push({ startRow: rangeStart, endRow: prev });
    rangeStart = current;
    prev = current;
  }
  ranges.push({ startRow: rangeStart, endRow: prev });
  return ranges.map(({ startRow, endRow }) => {
    const rows = payload.rows.slice(startRow, endRow + 1);
    const left = summarizeLineRange(rows.map((row) => row.left_no));
    const right = summarizeLineRange(rows.map((row) => row.right_no));
    return {
      startRow,
      endRow,
      leftStart: left.start,
      leftEnd: left.end,
      rightStart: right.start,
      rightEnd: right.end,
    };
  });
}

function rangeSortScore(symbol: DiffSymbolSpan, matchedLines: number): number {
  return matchedLines * 1_000_000 - (symbol.end_line - symbol.start_line);
}

function findBestSymbolForSide(
  symbols: DiffSymbolSpan[],
  lines: number[],
  side: "left" | "right",
): DiffSelectionSymbolMatch | null {
  if (symbols.length === 0 || lines.length === 0) {
    return null;
  }
  let best: DiffSelectionSymbolMatch | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const symbol of symbols) {
    const matched = lines.filter(
      (line) => line >= symbol.start_line && line <= symbol.end_line,
    ).length;
    if (matched === 0) {
      continue;
    }
    const score = rangeSortScore(symbol, matched);
    if (score > bestScore) {
      bestScore = score;
      best = { ...symbol, side };
    }
  }
  return best;
}

function findBestEnclosingSymbol(
  payload: FileDiffPayload,
  selectedRows: DiffRow[],
): DiffSelectionSymbolMatch | null {
  const leftLines = selectedRows
    .map((row) => row.left_no)
    .filter((line): line is number => line != null);
  const rightLines = selectedRows
    .map((row) => row.right_no)
    .filter((line): line is number => line != null);
  const leftMatch = findBestSymbolForSide(payload.left_symbols, leftLines, "left");
  const rightMatch = findBestSymbolForSide(payload.right_symbols, rightLines, "right");
  if (!leftMatch) {
    return rightMatch;
  }
  if (!rightMatch) {
    return leftMatch;
  }
  const leftScore = rangeSortScore(leftMatch, leftLines.filter(
    (line) => line >= leftMatch.start_line && line <= leftMatch.end_line,
  ).length);
  const rightScore = rangeSortScore(rightMatch, rightLines.filter(
    (line) => line >= rightMatch.start_line && line <= rightMatch.end_line,
  ).length);
  return rightScore > leftScore ? rightMatch : leftMatch;
}

function buildSelectionLabel(
  ranges: DiffSelectionLineRange[],
  symbol: DiffSelectionSymbolMatch | null,
): string {
  if (symbol) {
    return `${symbol.kind} ${symbol.name}`;
  }
  const parts = ranges
    .map((range) => {
      const left = lineRangeLabel(range.leftStart, range.leftEnd, "L");
      const right = lineRangeLabel(range.rightStart, range.rightEnd, "R");
      return [left, right].filter(Boolean).join(" / ");
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Selected diff lines";
}

function rowsWithinSymbol(payload: FileDiffPayload, symbol: DiffSelectionSymbolMatch): DiffRow[] {
  return payload.rows.filter((row) => {
    const line = symbol.side === "left" ? row.left_no : row.right_no;
    return line != null && line >= symbol.start_line && line <= symbol.end_line;
  });
}

function slugifySelectionKey(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "selection";
}

export function isSelectableDiffRow(row: DiffRow): boolean {
  return !row.is_truncation_marker;
}

export function isChangedDiffRow(row: DiffRow): boolean {
  return row.is_changed;
}

export interface SelectedDiffDocContext {
  selectedIndices: number[];
  lineRanges: DiffSelectionLineRange[];
  requestedMode: SelectionDocMode;
  effectiveMode: SelectionDocMode;
  selectedRows: DiffRow[];
  focusRows: DiffRow[];
  selectedExcerpt?: string;
  focusExcerpt?: string;
  symbol: DiffSelectionSymbolMatch | null;
  label: string;
  selectionKey: string;
}

export function buildSelectedDiffDocContext(
  payload: FileDiffPayload | null,
  selectedIndices: number[],
  requestedMode: SelectionDocMode,
): SelectedDiffDocContext | null {
  if (!payload?.rows?.length) {
    return null;
  }
  const ordered = compactIndices(selectedIndices).filter(
    (index) => payload.rows[index] && isSelectableDiffRow(payload.rows[index]),
  );
  if (ordered.length === 0) {
    return null;
  }
  const selectedRows = getRowsForIndices(payload, ordered);
  const symbol = findBestEnclosingSymbol(payload, selectedRows);
  const effectiveMode: SelectionDocMode =
    requestedMode === "expanded" && symbol ? "expanded" : "exact";
  const focusRows =
    effectiveMode === "expanded" && symbol
      ? rowsWithinSymbol(payload, symbol)
      : rowsForWindow(payload, ordered, EXACT_CONTEXT_PADDING);
  const lineRanges = buildLineRanges(payload, ordered);
  const label = buildSelectionLabel(lineRanges, effectiveMode === "expanded" ? symbol : null);
  const selectedExcerpt = buildExcerpt(selectedRows, EXACT_SELECTION_EXCERPT_MAX);
  const focusExcerpt = buildExcerpt(
    focusRows,
    effectiveMode === "expanded"
      ? EXPANDED_SELECTION_EXCERPT_MAX
      : EXACT_SELECTION_EXCERPT_MAX,
  );
  const rangeKey = lineRanges
    .map((range) => `${range.startRow}-${range.endRow}`)
    .join("__");
  const selectionKey = slugifySelectionKey(
    `${effectiveMode}__${symbol ? `${symbol.side}-${symbol.kind}-${symbol.name}` : label}__${rangeKey}`,
  );
  return {
    selectedIndices: ordered,
    lineRanges,
    requestedMode,
    effectiveMode,
    selectedRows,
    focusRows,
    selectedExcerpt,
    focusExcerpt,
    symbol: effectiveMode === "expanded" ? symbol : null,
    label,
    selectionKey,
  };
}
