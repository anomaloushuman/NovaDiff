import {
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FixedSizeList as List, type ListChildComponentProps } from "react-window";
import type { FileChange } from "../app/types";
import {
  ancestorDirPaths,
  buildChangedFilesTreeRoot,
  flattenVisibleRows,
  type FlatRow,
} from "../app/changedFilesTree";

const TREE_ROW_HEIGHT = 38;

interface ChangedFilesTreeProps {
  rows: FileChange[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

type ListItemData = {
  flatRows: FlatRow[];
  expandedDirs: Set<string>;
  selectedPath: string | null;
  onToggleDir: (fullPath: string) => void;
  onSelectFile: (path: string) => void;
};

function TreeRow({
  index,
  style,
  data,
}: ListChildComponentProps<ListItemData>) {
  const {
    flatRows,
    expandedDirs,
    selectedPath,
    onToggleDir,
    onSelectFile,
  } = data;
  const row = flatRows[index];
  if (!row) {
    return null;
  }

  if (row.rowKind === "dir") {
    const open = expandedDirs.has(row.fullPath);
    return (
      <div style={style} className="file-tree-virt-row">
        <button
          type="button"
          className="file-tree-dir"
          style={{ paddingLeft: 10 + row.depth * 14 }}
          aria-expanded={open}
          onClick={() => onToggleDir(row.fullPath)}
        >
          <span className="file-tree-chevron" aria-hidden>
            {open ? "▾" : "▸"}
          </span>
          <span className="file-tree-dir-name">{row.name}</span>
        </button>
      </div>
    );
  }

  const active = selectedPath === row.fullPath;
  return (
    <div style={style} className="file-tree-virt-row">
      <button
        type="button"
        className={
          active ? "file-pill file-tree-file active" : "file-pill file-tree-file"
        }
        style={{ paddingLeft: 10 + row.depth * 14 }}
        title={row.fullPath}
        onClick={() => onSelectFile(row.fullPath)}
      >
        <span className={`kind-dot ${row.changeKind}`} aria-hidden />
        <span className="file-pill-path file-tree-file-name">{row.name}</span>
      </button>
    </div>
  );
}

export function ChangedFilesTree({
  rows,
  selectedPath,
  onSelectFile,
}: ChangedFilesTreeProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const deferredRows = useDeferredValue(rows);
  const [listWidth, setListWidth] = useState(260);
  const [listHeight, setListHeight] = useState(320);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set());

  const root = useMemo(
    () => buildChangedFilesTreeRoot(deferredRows),
    [deferredRows],
  );
  const flatRows = useMemo(
    () => flattenVisibleRows(root, expandedDirs),
    [root, expandedDirs],
  );

  const rowsRef = useRef(rows);
  useLayoutEffect(() => {
    if (rowsRef.current !== rows) {
      rowsRef.current = rows;
      setExpandedDirs(new Set());
    }
  }, [rows]);

  const onToggleDir = useCallback((fullPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(fullPath)) {
        next.delete(fullPath);
      } else {
        next.add(fullPath);
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    if (!selectedPath) {
      return;
    }
    const ancestors = ancestorDirPaths(selectedPath);
    if (ancestors.length === 0) {
      return;
    }
    setExpandedDirs((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const d of ancestors) {
        if (!next.has(d)) {
          next.add(d);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selectedPath]);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) {
      return;
    }
    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setListWidth(Math.max(120, Math.floor(w)));
      setListHeight(Math.max(120, Math.floor(h)));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!selectedPath) {
      return;
    }
    const idx = flatRows.findIndex(
      (r) => r.rowKind === "file" && r.fullPath === selectedPath,
    );
    if (idx >= 0) {
      listRef.current?.scrollToItem(idx, "smart");
    }
  }, [selectedPath, flatRows]);

  const itemData = useMemo<ListItemData>(
    () => ({
      flatRows,
      expandedDirs,
      selectedPath,
      onToggleDir,
      onSelectFile,
    }),
    [flatRows, expandedDirs, selectedPath, onToggleDir, onSelectFile],
  );

  if (rows.length === 0) {
    return (
      <p className="insights-empty">No files yet. Compare two folders first.</p>
    );
  }

  return (
    <div ref={hostRef} className="changed-files-tree-host">
      {flatRows.length === 0 ? (
        <p className="insights-empty">No visible files. Expand a folder.</p>
      ) : (
        <List
          ref={listRef}
          height={listHeight}
          width={listWidth}
          itemCount={flatRows.length}
          itemSize={TREE_ROW_HEIGHT}
          itemData={itemData}
          overscanCount={8}
        >
          {TreeRow}
        </List>
      )}
    </div>
  );
}
