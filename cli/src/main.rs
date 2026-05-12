//! Folder compare and line diff. Parallel directory walks and SHA-256 hashing use
//! Rayon (CPU). GPU-backed inference runs in Ollama / LM Studio, not in this CLI.

use rayon::prelude::*;
use serde::Serialize;
use sha2::{Digest, Sha256};
use similar::{ChangeTag, TextDiff};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, BufReader, Read};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const MAX_DIFF_ROWS: usize = 8000;

#[derive(Serialize, Clone, Copy)]
#[serde(rename_all = "lowercase")]
enum ChangeKind {
    Added,
    Removed,
    Modified,
}

#[derive(Serialize)]
struct FileChange {
    path: String,
    kind: ChangeKind,
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
    fn rel_path_normalizes() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let full = root.join("src").join("main.rs");
        assert_eq!(rel_path(&root, &full).as_deref(), Some("src/main.rs"));
    }
}
