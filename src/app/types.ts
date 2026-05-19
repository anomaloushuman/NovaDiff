export type ChangeKind = "added" | "removed" | "modified";
export type NovadiffDocsBundleKey =
  | "change-report"
  | "codebase-baseline"
  | "codebase-target";
export type NovadiffDocsPage =
  | "index.html"
  | "narrative.html"
  | "metrics.html"
  | "diagrams.html"
  | "release.html";

export interface FileChange {
  path: string;
  kind: ChangeKind;
}

export interface DiffRow {
  row_id: string;
  left_no: number | null;
  right_no: number | null;
  left: string;
  right: string;
  left_style: "equal" | "removed" | "empty";
  right_style: "equal" | "added" | "empty";
  is_changed: boolean;
  is_truncation_marker: boolean;
}

export interface DiffSymbolSpan {
  name: string;
  kind: string;
  start_line: number;
  end_line: number;
}

export interface DiffSelectionLineRange {
  startRow: number;
  endRow: number;
  leftStart: number | null;
  leftEnd: number | null;
  rightStart: number | null;
  rightEnd: number | null;
}

export interface DiffSelectionSymbolMatch extends DiffSymbolSpan {
  side: "left" | "right";
}

export type SelectionDocMode = "exact" | "expanded";

export interface SelectionDocArtifactMeta {
  relPath: string;
  kind: ChangeKind;
  label: string;
  selectionKey: string;
  requestedMode: SelectionDocMode;
  effectiveMode: SelectionDocMode;
  lineRanges: DiffSelectionLineRange[];
  symbol?: DiffSelectionSymbolMatch | null;
}

export interface FileDiffPayload {
  rows: DiffRow[];
  truncated: boolean;
  line_additions: number;
  line_deletions: number;
  left_symbols: DiffSymbolSpan[];
  right_symbols: DiffSymbolSpan[];
  summary_evidence?: FileSummaryEvidence;
}

export type EvidenceBadgeTone = "good" | "neutral" | "warn";

export interface EvidenceBadge {
  key: string;
  label: string;
  tone: EvidenceBadgeTone;
  description?: string;
}

export interface FileSummaryEvidence {
  file_roles: string[];
  touched_symbols: string[];
  changed_line_ranges: string[];
  changed_imports: string[];
  changed_exports: string[];
  cited_changed_lines: string[];
  verification_hints: string[];
  evidence_limits: string[];
  badges: EvidenceBadge[];
}

export interface OutlineFileSummary {
  path: string;
  ext: string;
  top_directory: string;
  depth: number;
  line_count: number;
  symbol_count: number;
}

export interface OutlineSymbolSummary extends DiffSymbolSpan {
  path: string;
  line_count: number;
  parent_name?: string | null;
  parent_kind?: string | null;
  container_kind?: "file" | "symbol";
}

export interface OutlineSymbolFileEntry {
  path: string;
  line_count: number;
  symbols: OutlineSymbolSummary[];
}

export interface OutlineDetectedProject {
  kind?: string;
  markers?: string[];
}

export interface CodebaseOutline {
  total_files: number;
  by_extension: Array<{ ext: string; count: number }>;
  top_directories: Array<{ name: string; count: number }>;
  detected_projects: OutlineDetectedProject[];
  import_edges: Array<{ from: string; to: string }>;
  import_graph_mermaid: string;
  cross_file_call_edges: Array<{
    from_file: string;
    to_file: string;
    via: string;
  }>;
  cross_file_call_graph_mermaid: string;
  symbols_by_file: Array<{ path: string; symbols: string[] }>;
  symbol_spans_by_file?: OutlineSymbolFileEntry[];
  files?: OutlineFileSummary[];
  class_diagram_mermaid: string;
  prompt_appendix: string;
}

export type CodeCityRootSide = "baseline" | "target" | "ghost";
export type CodeCityChangeState = "unchanged" | "added" | "removed" | "modified";

export interface CodeCityOwnershipSummary {
  author: string;
  lineCount: number;
  ratio: number;
}

export type RiskSignalSeverity = "low" | "medium" | "high";
export type RiskSignalConfidence = "low" | "medium" | "high";
export type RiskSignalSource = "heuristic" | "advisory";

export interface RiskSignalAdvisoryMeta {
  ecosystem?: string;
  packageName?: string;
  advisoryId?: string;
}

export interface RiskSignal {
  id: string;
  source: RiskSignalSource;
  category: string;
  severity: RiskSignalSeverity;
  confidence: RiskSignalConfidence;
  title: string;
  rel_path?: string | null;
  evidence: string[];
  advisory?: RiskSignalAdvisoryMeta | null;
}

export interface SummaryIndexEntry {
  relPath: string;
  kind: ChangeKind;
  markdown: string;
  badges?: EvidenceBadge[];
  htmlRelPath?: string | null;
}

export interface SelectionIndexEntry extends SelectionDocArtifactMeta {
  markdown: string;
  htmlRelPath?: string | null;
}

export interface CodeCityFileNode {
  id: string;
  rootSide: CodeCityRootSide;
  path: string;
  ext: string;
  topDirectory: string;
  depth: number;
  lineCount: number;
  symbolCount: number;
  changeState: CodeCityChangeState;
  dominantAuthor?: string | null;
  owners: CodeCityOwnershipSummary[];
}

export interface CodeCitySymbolNode {
  id: string;
  fileId: string;
  rootSide: CodeCityRootSide;
  path: string;
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  parentName?: string | null;
  parentKind?: string | null;
  changeState: CodeCityChangeState;
  dominantAuthor?: string | null;
  owners: CodeCityOwnershipSummary[];
}

export interface CodeCityModel {
  generatedAt: string;
  baselineLabel: string;
  targetLabel: string;
  files: CodeCityFileNode[];
  symbols: CodeCitySymbolNode[];
  authors: string[];
}
