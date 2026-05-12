//! Folder compare and line diff. Parallel directory walks and SHA-256 hashing use
//! Rayon (CPU). GPU-backed inference runs in Ollama / LM Studio, not in this CLI.
//!
//! The `prefetch-summary-queue` command returns a **prioritized job list** for the
//! Electron main process, which runs summarization sequentially against the local
//! LLM (see `electron/prefetch-summaries.cjs`). When `leftRoot` / `rightRoot` are
//! sent, paths matching each tree’s **root `.gitignore`** or **`.git/info/exclude`**
//! are omitted from the queue (same relative paths as compare output). This binary
//! does not open HTTP for summaries — it orders work only.

use ignore::gitignore::GitignoreBuilder;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use similar::{ChangeTag, TextDiff};
use std::collections::HashMap;
use std::cmp::Ordering;
use std::fs::File;
use std::io::{self, BufReader, Read};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const MAX_DIFF_ROWS: usize = 8000;

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
enum ChangeKind {
    Added,
    Removed,
    Modified,
}

#[derive(Serialize, Deserialize, Clone)]
struct FileChange {
    path: String,
    kind: ChangeKind,
}

/// Normalized `/` path segments (non-empty).
fn path_segments(rel: &str) -> Vec<String> {
    rel.replace('\\', "/")
        .split('/')
        .filter(|s| !s.is_empty())
        .map(String::from)
        .collect()
}

fn path_depth(rel: &str) -> usize {
    path_segments(rel).len()
}

/// Immediate parent directory path (`""` for root-level files).
fn parent_dir(rel: &str) -> String {
    let s = rel.replace('\\', "/");
    match s.rfind('/') {
        Some(i) => s[..i].to_string(),
        None => String::new(),
    }
}

/// For every prefix `p` (including `""` for the synthetic root), count how many
/// changed paths lie under that prefix (`q == p` or `q` starts with `p/`).
/// Used so branches with fewer nested changes sort earlier in the prefetch queue.
fn subtree_change_counts(paths: &[String]) -> HashMap<String, usize> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for q in paths {
        let qn = q.replace('\\', "/");
        *counts.entry(String::new()).or_insert(0) += 1;
        let segs = path_segments(&qn);
        for i in 0..segs.len() {
            let pref = segs[..=i].join("/");
            *counts.entry(pref).or_insert(0) += 1;
        }
    }
    counts
}

#[derive(Serialize)]
struct PrefetchSummaryJob {
    path: String,
    kind: ChangeKind,
    depth: usize,
    parent_subtree_weight: usize,
}

#[derive(Serialize)]
struct PrefetchSummaryQueueOut {
    /// Prioritized jobs (truncated to `limit` for IPC size).
    queue: Vec<PrefetchSummaryJob>,
    /// Rows received from compare (before gitignore filtering).
    input_changes: usize,
    /// Dropped because the path matched `.gitignore` or `.git/info/exclude` on the
    /// baseline and/or target root (when `leftRoot` / `rightRoot` were provided).
    skipped_gitignore: usize,
    /// Rows eligible for prefetch after gitignore filtering (sorting uses this set).
    eligible_changes: usize,
    /// Number of jobs returned (same as `queue.len()`).
    returned: usize,
}

fn try_build_gitignore_for_root(root: &Path) -> Option<ignore::gitignore::Gitignore> {
    if !root.is_dir() {
        return None;
    }
    let gitignore = root.join(".gitignore");
    let exclude = root.join(".git").join("info").join("exclude");
    if !gitignore.is_file() && !exclude.is_file() {
        return None;
    }
    let mut builder = GitignoreBuilder::new(root);
    if gitignore.is_file() {
        let _ = builder.add(&gitignore);
    }
    if exclude.is_file() {
        let _ = builder.add(&exclude);
    }
    builder.build().ok()
}

/// Drops paths ignored by **either** tree root’s `.gitignore` / `.git/info/exclude`
/// (root-level rules only; matches use the same relative paths as compare output).
fn filter_changes_for_prefetch_gitignore(
    changes: &[FileChange],
    left_root: &Path,
    right_root: &Path,
) -> (Vec<FileChange>, usize) {
    let left_gi = try_build_gitignore_for_root(left_root);
    let right_gi = try_build_gitignore_for_root(right_root);
    if left_gi.is_none() && right_gi.is_none() {
        return (changes.to_vec(), 0);
    }
    let mut kept: Vec<FileChange> = Vec::with_capacity(changes.len());
    let mut skipped = 0usize;
    for c in changes {
        let rel = c.path.replace('\\', "/");
        let ignored_left = left_gi
            .as_ref()
            .map(|g| g.matched_path_or_any_parents(&rel, false).is_ignore())
            .unwrap_or(false);
        let ignored_right = right_gi
            .as_ref()
            .map(|g| g.matched_path_or_any_parents(&rel, false).is_ignore())
            .unwrap_or(false);
        if ignored_left || ignored_right {
            skipped += 1;
        } else {
            kept.push(c.clone());
        }
    }
    (kept, skipped)
}

/// Order: shallower paths first; within the same depth, branches with **smaller**
/// subtree change counts (fewer nested changes under the immediate parent) first;
/// then lexicographic path. Root-level files are depth 1.
fn prefetch_summary_queue(
    changes: &[FileChange],
    limit: usize,
    gitignore_roots: Option<(&Path, &Path)>,
) -> PrefetchSummaryQueueOut {
    let input_changes = changes.len();
    let (eligible, skipped_gitignore) = if let Some((l, r)) = gitignore_roots {
        filter_changes_for_prefetch_gitignore(changes, l, r)
    } else {
        (changes.to_vec(), 0usize)
    };
    let eligible_changes = eligible.len();
    let paths: Vec<String> = eligible.iter().map(|c| c.path.replace('\\', "/")).collect();
    let weights = subtree_change_counts(&paths);

    let mut sorted: Vec<FileChange> = eligible;
    sorted.sort_by(|a, b| {
        let ap = a.path.replace('\\', "/");
        let bp = b.path.replace('\\', "/");
        let da = path_depth(&ap);
        let db = path_depth(&bp);
        match da.cmp(&db) {
            Ordering::Equal => {}
            o => return o,
        }
        let wa = *weights.get(&parent_dir(&ap)).unwrap_or(&0);
        let wb = *weights.get(&parent_dir(&bp)).unwrap_or(&0);
        match wa.cmp(&wb) {
            Ordering::Equal => {}
            o => return o,
        }
        ap.cmp(&bp)
    });

    let cap = limit.max(1);
    let queue: Vec<PrefetchSummaryJob> = sorted
        .iter()
        .take(cap)
        .map(|c| {
            let p = c.path.replace('\\', "/");
            let parent = parent_dir(&p);
            let parent_subtree_weight = *weights.get(&parent).unwrap_or(&0);
            PrefetchSummaryJob {
                path: c.path.clone(),
                kind: c.kind,
                depth: path_depth(&p),
                parent_subtree_weight,
            }
        })
        .collect();

    let returned = queue.len();
    PrefetchSummaryQueueOut {
        queue,
        input_changes,
        skipped_gitignore,
        eligible_changes,
        returned,
    }
}

#[derive(Serialize)]
struct DiffRow {
    left_no: Option<u32>,
    right_no: Option<u32>,
    left: String,
    right: String,
    left_style: &'static str,
    right_style: &'static str,
}

#[derive(Serialize)]
struct FileDiffPayload {
    rows: Vec<DiffRow>,
    truncated: bool,
    line_additions: u32,
    line_deletions: u32,
}

fn rel_path(root: &Path, full: &Path) -> Option<String> {
    full.strip_prefix(root).ok().map(|p| {
        p.components()
            .map(|c| c.as_os_str().to_string_lossy().into_owned())
            .collect::<Vec<_>>()
            .join("/")
    })
}

fn hash_file(path: &Path) -> Result<String, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 64 * 1024];
    loop {
        let n = reader.read(&mut buffer).map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn collect_files(root: &Path) -> Result<HashMap<String, PathBuf>, String> {
    let mut out = HashMap::new();
    if !root.is_dir() {
        return Err(format!("Not a directory: {}", root.display()));
    }
    for entry in WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let full = entry.path();
            if let Some(rel) = rel_path(root, full) {
                if !rel.is_empty() {
                    out.insert(rel, full.to_path_buf());
                }
            }
        }
    }
    Ok(out)
}

fn compare_folders(left: &str, right: &str) -> Result<Vec<FileChange>, String> {
    let left_root = PathBuf::from(left.trim());
    let right_root = PathBuf::from(right.trim());

    // Parallel directory walks (I/O bound; separate trees).
    let (left_map, right_map) = rayon::join(
        || collect_files(&left_root),
        || collect_files(&right_root),
    );
    let left_map = left_map?;
    let right_map = right_map?;

    let mut changes: Vec<FileChange> = Vec::new();

    for (rel, _) in &left_map {
        if !right_map.contains_key(rel) {
            changes.push(FileChange {
                path: rel.clone(),
                kind: ChangeKind::Removed,
            });
        }
    }

    for rel in right_map.keys() {
        if !left_map.contains_key(rel) {
            changes.push(FileChange {
                path: rel.clone(),
                kind: ChangeKind::Added,
            });
        }
    }

    let pairs: Vec<(String, PathBuf, PathBuf)> = left_map
        .iter()
        .filter_map(|(rel, lpath)| {
            right_map
                .get(rel)
                .map(|rpath| (rel.clone(), lpath.clone(), rpath.clone()))
        })
        .collect();

    // Parallel SHA-256 over independent files (CPU bound; uses all cores).
    let hash_outcomes: Vec<Result<Option<FileChange>, String>> = pairs
        .par_iter()
        .map(|(rel, lpath, rpath)| {
            let lh = hash_file(lpath)?;
            let rh = hash_file(rpath)?;
            Ok(if lh != rh {
                Some(FileChange {
                    path: rel.clone(),
                    kind: ChangeKind::Modified,
                })
            } else {
                None
            })
        })
        .collect();

    for outcome in hash_outcomes {
        match outcome {
            Ok(Some(fc)) => changes.push(fc),
            Ok(None) => {}
            Err(e) => return Err(e),
        }
    }

    changes.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(changes)
}

fn read_utf8_file(path: &Path) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("{}: {e}", path.display()))?;
    if bytes.contains(&0) {
        return Err("Binary or non-text file (skipped)".into());
    }
    String::from_utf8(bytes).map_err(|e| format!("{}: {e}", path.display()))
}

fn line_diff_to_rows(old: &str, new: &str) -> FileDiffPayload {
    let diff = TextDiff::from_lines(old, new);
    let mut rows: Vec<DiffRow> = Vec::new();
    let mut adds = 0u32;
    let mut dels = 0u32;

    for change in diff.iter_all_changes() {
        let raw = change.value().to_string();
        let line = raw.trim_end_matches('\n').to_string();
        let ln_l = change.old_index().map(|i| i as u32 + 1);
        let ln_r = change.new_index().map(|i| i as u32 + 1);
        match change.tag() {
            ChangeTag::Equal => {
                rows.push(DiffRow {
                    left_no: ln_l,
                    right_no: ln_r,
                    left: line.clone(),
                    right: line,
                    left_style: "equal",
                    right_style: "equal",
                });
            }
            ChangeTag::Delete => {
                dels += 1;
                rows.push(DiffRow {
                    left_no: ln_l,
                    right_no: None,
                    left: line,
                    right: String::new(),
                    left_style: "removed",
                    right_style: "empty",
                });
            }
            ChangeTag::Insert => {
                adds += 1;
                rows.push(DiffRow {
                    left_no: None,
                    right_no: ln_r,
                    left: String::new(),
                    right: line,
                    left_style: "empty",
                    right_style: "added",
                });
            }
        }
        if rows.len() >= MAX_DIFF_ROWS {
            rows.push(DiffRow {
                left_no: None,
                right_no: None,
                left: "… diff truncated (file too large)".into(),
                right: String::new(),
                left_style: "equal",
                right_style: "empty",
            });
            return FileDiffPayload {
                rows,
                truncated: true,
                line_additions: adds,
                line_deletions: dels,
            };
        }
    }

    FileDiffPayload {
        rows,
        truncated: false,
        line_additions: adds,
        line_deletions: dels,
    }
}

fn get_file_diff(
    left_root: &str,
    right_root: &str,
    rel_path: &str,
    kind: &str,
) -> Result<FileDiffPayload, String> {
    let left_root = PathBuf::from(left_root.trim());
    let right_root = PathBuf::from(right_root.trim());
    let rel = rel_path.trim();

    let (old_text, new_text) = match kind {
        "added" => {
            let r = right_root.join(rel);
            (String::new(), read_utf8_file(&r)?)
        }
        "removed" => {
            let l = left_root.join(rel);
            (read_utf8_file(&l)?, String::new())
        }
        "modified" => {
            let l = left_root.join(rel);
            let r = right_root.join(rel);
            let (old_res, new_res) = rayon::join(|| read_utf8_file(&l), || read_utf8_file(&r));
            (old_res?, new_res?)
        }
        _ => return Err(format!("Unknown change kind: {kind}")),
    };

    Ok(line_diff_to_rows(&old_text, &new_text))
}

fn main() -> Result<(), String> {
    let mut buf = String::new();
    io::stdin()
        .read_to_string(&mut buf)
        .map_err(|e| e.to_string())?;
    let v: serde_json::Value = serde_json::from_str(buf.trim()).map_err(|e| e.to_string())?;

    let cmd = v
        .get("cmd")
        .and_then(|c| c.as_str())
        .ok_or_else(|| "Missing \"cmd\"".to_string())?;

    let out = match cmd {
        "compare-folders" => {
            let left = v
                .get("left")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing left".to_string())?;
            let right = v
                .get("right")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing right".to_string())?;
            serde_json::to_value(compare_folders(left, right)?).map_err(|e| e.to_string())?
        }
        "get-file-diff" => {
            let left_root = v
                .get("leftRoot")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing leftRoot".to_string())?;
            let right_root = v
                .get("rightRoot")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing rightRoot".to_string())?;
            let rel_path = v
                .get("relPath")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing relPath".to_string())?;
            let kind = v
                .get("kind")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing kind".to_string())?;
            serde_json::to_value(get_file_diff(left_root, right_root, rel_path, kind)?)
                .map_err(|e| e.to_string())?
        }
        "prefetch-summary-queue" => {
            let changes: Vec<FileChange> = serde_json::from_value(
                v.get("changes")
                    .cloned()
                    .ok_or_else(|| "Missing changes".to_string())?,
            )
            .map_err(|e| format!("Invalid changes: {e}"))?;
            let limit = v
                .get("limit")
                .and_then(|x| x.as_u64())
                .unwrap_or(200) as usize;
            let out = match (
                v.get("leftRoot").and_then(|x| x.as_str()),
                v.get("rightRoot").and_then(|x| x.as_str()),
            ) {
                (Some(l), Some(r)) => {
                    let left_pb = PathBuf::from(l.trim());
                    let right_pb = PathBuf::from(r.trim());
                    prefetch_summary_queue(
                        &changes,
                        limit,
                        Some((left_pb.as_path(), right_pb.as_path())),
                    )
                }
                _ => prefetch_summary_queue(&changes, limit, None),
            };
            serde_json::to_value(out).map_err(|e| e.to_string())?
        }
        other => return Err(format!("Unknown cmd: {other}")),
    };

    print!("{}", serde_json::to_string(&out).map_err(|e| e.to_string())?);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn prefetch_queue_roots_first_then_shallower_branches() {
        let changes = vec![
            FileChange {
                path: "heavy/a1.txt".into(),
                kind: ChangeKind::Added,
            },
            FileChange {
                path: "heavy/a2.txt".into(),
                kind: ChangeKind::Added,
            },
            FileChange {
                path: "heavy/nested/x.txt".into(),
                kind: ChangeKind::Modified,
            },
            FileChange {
                path: "root.txt".into(),
                kind: ChangeKind::Added,
            },
            FileChange {
                path: "light/y.txt".into(),
                kind: ChangeKind::Added,
            },
        ];
        let out = prefetch_summary_queue(&changes, 50, None);
        assert_eq!(out.queue[0].path, "root.txt");
        assert_eq!(out.queue[1].path, "light/y.txt");
        assert!(out.queue[1].depth <= out.queue[2].depth);
        let pos_heavy_a1 = out.queue.iter().position(|j| j.path == "heavy/a1.txt").unwrap();
        let pos_light = out.queue.iter().position(|j| j.path == "light/y.txt").unwrap();
        assert!(pos_light < pos_heavy_a1);
    }

    #[test]
    fn prefetch_queue_respects_limit() {
        let changes: Vec<FileChange> = (0..30)
            .map(|i| FileChange {
                path: format!("f{i}.txt"),
                kind: ChangeKind::Added,
            })
            .collect();
        let out = prefetch_summary_queue(&changes, 5, None);
        assert_eq!(out.returned, 5);
        assert_eq!(out.input_changes, 30);
        assert_eq!(out.eligible_changes, 30);
        assert_eq!(out.skipped_gitignore, 0);
    }

    #[test]
    fn prefetch_skips_gitignored_when_roots_sent() {
        let tmp = std::env::temp_dir().join(format!(
            "novadiff-gi-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir_all(&tmp).unwrap();
        std::fs::write(tmp.join(".gitignore"), "ignored.txt\nbuild/\n").unwrap();
        let changes = vec![
            FileChange {
                path: "ignored.txt".into(),
                kind: ChangeKind::Added,
            },
            FileChange {
                path: "keep.rs".into(),
                kind: ChangeKind::Modified,
            },
            FileChange {
                path: "build/out.bin".into(),
                kind: ChangeKind::Added,
            },
        ];
        let out = prefetch_summary_queue(
            &changes,
            50,
            Some((tmp.as_path(), tmp.as_path())),
        );
        assert_eq!(out.input_changes, 3);
        assert_eq!(out.skipped_gitignore, 2);
        assert_eq!(out.eligible_changes, 1);
        assert_eq!(out.queue.len(), 1);
        assert_eq!(out.queue[0].path, "keep.rs");
        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn rel_path_normalizes() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let full = root.join("src").join("main.rs");
        assert_eq!(rel_path(&root, &full).as_deref(), Some("src/main.rs"));
    }
}
