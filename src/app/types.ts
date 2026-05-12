export type ChangeKind = "added" | "removed" | "modified";

export interface FileChange {
  path: string;
  kind: ChangeKind;
}

export interface DiffRow {
  left_no: number | null;
  right_no: number | null;
  left: string;
  right: string;
  left_style: "equal" | "removed" | "empty";
  right_style: "equal" | "added" | "empty";
}

export interface FileDiffPayload {
  rows: DiffRow[];
  truncated: boolean;
  line_additions: number;
  line_deletions: number;
}
