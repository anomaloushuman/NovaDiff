//! Folder compare and line diff. Parallel directory walks and SHA-256 hashing use
//! Rayon (CPU). GPU-backed inference runs in Ollama / LM Studio, not in this CLI.
//!
//! The `prefetch-summary-queue` command returns a **prioritized job list** for the
//! Electron main process, which runs summarization sequentially against the local
//! LLM (see `electron/prefetch-summaries.cjs`). When `leftRoot` / `rightRoot` are
//! sent, paths matching each tree’s **root `.gitignore`** or **`.git/info/exclude`**
//! are omitted from the queue (same relative paths as compare output). The
//! `filter-changes-gitignore` command applies the same filter to a full change list
//! (for documentation metrics / LLM context). Paths under **`novadiff-docs/`** are
//! reserved for on-disk docs emitted by the app: they are excluded from folder
//! compare, prefetch, and that filter. This binary does not open HTTP for
//! summaries — it compares paths, diffs files, orders prefetch, filters changes, and
//! emits a bounded **codebase outline** JSON for documentation (regex heuristics).

use ignore::gitignore::GitignoreBuilder;
use regex::Regex;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use similar::{ChangeTag, TextDiff};
use std::collections::{HashMap, HashSet};
use std::cmp::Ordering;
use std::fs::File;
use std::io::{self, BufReader, Read};
use std::path::{Component, Path, PathBuf};
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
    /// Dropped because the path is under **`novadiff-docs/`** (generated doc bundle).
    skipped_novadiff_docs: usize,
    /// Dropped because the changed file is binary or otherwise non-UTF-8 text.
    skipped_non_text: usize,
    /// Rows eligible after gitignore (when used) and **`novadiff-docs/`** filtering.
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

const NOVADIFF_DOCS_DIR: &str = "novadiff-docs";

/// Reserved relative paths for NovaDiff-generated docs on disk (never compared or LLM-prefetched).
fn is_novadiff_docs_reserved_rel(rel: &str) -> bool {
    let s = rel.replace('\\', "/");
    s == NOVADIFF_DOCS_DIR || s.starts_with("novadiff-docs/")
}

fn filter_out_novadiff_docs_changes(changes: &[FileChange]) -> (Vec<FileChange>, usize) {
    let mut kept: Vec<FileChange> = Vec::with_capacity(changes.len());
    let mut skipped = 0usize;
    for c in changes {
        if is_novadiff_docs_reserved_rel(&c.path) {
            skipped += 1;
        } else {
            kept.push(c.clone());
        }
    }
    (kept, skipped)
}

/// Skip heavy or generated subtrees (both sides of compare + outline scan).
fn walk_path_allowed(root: &Path, path: &Path) -> bool {
    path.strip_prefix(root)
        .ok()
        .map(|rel| {
            for c in rel.components() {
                if let Component::Normal(os) = c {
                    let seg = os.to_string_lossy();
                    if matches!(
                        seg.as_ref(),
                        ".git" | "node_modules" | "target" | "dist" | "build" | ".next"
                            | "out" | "coverage" | "novadiff-docs"
                    ) {
                        return false;
                    }
                }
            }
            true
        })
        .unwrap_or(true)
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

fn is_utf8_text_file(path: &Path) -> Result<bool, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("{}: {e}", path.display()))?;
    if bytes.contains(&0) {
        return Ok(false);
    }
    Ok(String::from_utf8(bytes).is_ok())
}

fn is_change_text_eligible(change: &FileChange, left_root: &Path, right_root: &Path) -> bool {
    let rel = change.path.trim();
    let keep_on_error = |res: Result<bool, String>| match res {
        Ok(v) => v,
        Err(_) => true,
    };
    match change.kind {
        ChangeKind::Added => keep_on_error(is_utf8_text_file(&right_root.join(rel))),
        ChangeKind::Removed => keep_on_error(is_utf8_text_file(&left_root.join(rel))),
        ChangeKind::Modified => {
            keep_on_error(is_utf8_text_file(&left_root.join(rel)))
                && keep_on_error(is_utf8_text_file(&right_root.join(rel)))
        }
    }
}

fn filter_out_non_text_changes(
    changes: &[FileChange],
    left_root: &Path,
    right_root: &Path,
) -> (Vec<FileChange>, usize) {
    let mut kept: Vec<FileChange> = Vec::with_capacity(changes.len());
    let mut skipped = 0usize;
    for c in changes {
        if is_change_text_eligible(c, left_root, right_root) {
            kept.push(c.clone());
        } else {
            skipped += 1;
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
    let (after_gitignore, skipped_gitignore) = if let Some((l, r)) = gitignore_roots {
        filter_changes_for_prefetch_gitignore(changes, l, r)
    } else {
        (changes.to_vec(), 0usize)
    };
    let (after_reserved, skipped_novadiff_docs) = filter_out_novadiff_docs_changes(&after_gitignore);
    let (eligible, skipped_non_text) = if let Some((l, r)) = gitignore_roots {
        filter_out_non_text_changes(&after_reserved, l, r)
    } else {
        (after_reserved, 0usize)
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
        skipped_novadiff_docs,
        skipped_non_text,
        eligible_changes,
        returned,
    }
}

#[derive(Serialize)]
struct DiffRow {
    row_id: String,
    left_no: Option<u32>,
    right_no: Option<u32>,
    left: String,
    right: String,
    left_style: &'static str,
    right_style: &'static str,
    is_changed: bool,
    is_truncation_marker: bool,
}

#[derive(Serialize, Deserialize, Clone)]
struct DiffSymbolSpan {
    name: String,
    kind: String,
    start_line: u32,
    end_line: u32,
}

#[derive(Serialize)]
struct FileDiffPayload {
    rows: Vec<DiffRow>,
    truncated: bool,
    line_additions: u32,
    line_deletions: u32,
    left_symbols: Vec<DiffSymbolSpan>,
    right_symbols: Vec<DiffSymbolSpan>,
    summary_evidence: FileSummaryEvidence,
}

#[derive(Serialize, Deserialize, Clone)]
struct EvidenceBadge {
    key: String,
    label: String,
    tone: String,
    description: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
struct FileSummaryEvidence {
    file_roles: Vec<String>,
    touched_symbols: Vec<String>,
    changed_line_ranges: Vec<String>,
    changed_imports: Vec<String>,
    changed_exports: Vec<String>,
    cited_changed_lines: Vec<String>,
    verification_hints: Vec<String>,
    evidence_limits: Vec<String>,
    badges: Vec<EvidenceBadge>,
}

#[derive(Serialize, Deserialize, Clone)]
struct RiskSignal {
    id: String,
    source: String,
    category: String,
    severity: String,
    confidence: String,
    title: String,
    rel_path: Option<String>,
    evidence: Vec<String>,
    advisory: Option<serde_json::Value>,
}

fn empty_summary_evidence() -> FileSummaryEvidence {
    FileSummaryEvidence {
        file_roles: Vec::new(),
        touched_symbols: Vec::new(),
        changed_line_ranges: Vec::new(),
        changed_imports: Vec::new(),
        changed_exports: Vec::new(),
        cited_changed_lines: Vec::new(),
        verification_hints: Vec::new(),
        evidence_limits: Vec::new(),
        badges: Vec::new(),
    }
}

fn compact_snippet(text: &str, max_len: usize) -> String {
    let mut out = text.split_whitespace().collect::<Vec<_>>().join(" ");
    if out.len() > max_len {
        out.truncate(max_len.saturating_sub(1));
        out.push('…');
    }
    out
}

fn push_unique_string(out: &mut Vec<String>, value: &str) {
    if !out.iter().any(|item| item == value) {
        out.push(value.to_string());
    }
}

fn line_range_label(start: Option<u32>, end: Option<u32>, prefix: &str) -> Option<String> {
    match (start, end) {
        (Some(s), Some(e)) if e > s => Some(format!("{prefix}{s}-{e}")),
        (Some(s), _) => Some(format!("{prefix}{s}")),
        _ => None,
    }
}

fn detect_file_roles(rel: &str) -> Vec<String> {
    let low = rel.replace('\\', "/").to_ascii_lowercase();
    let mut out: Vec<String> = Vec::new();
    let base = low.rsplit('/').next().unwrap_or(low.as_str());
    if matches!(
        base,
        "package.json"
            | "cargo.toml"
            | "pyproject.toml"
            | "requirements.txt"
            | "poetry.lock"
            | "go.mod"
            | "pom.xml"
            | "build.gradle"
            | "build.gradle.kts"
    ) {
        push_unique_string(&mut out, "dependency-manifest");
    }
    if matches!(
        base,
        "package-lock.json"
            | "pnpm-lock.yaml"
            | "yarn.lock"
            | "cargo.lock"
            | "go.sum"
            | "poetry.lock"
            | "requirements.lock"
    ) {
        push_unique_string(&mut out, "lockfile");
    }
    if low.contains("/test/")
        || low.contains("/tests/")
        || low.contains("/__tests__/")
        || base.contains(".spec.")
        || base.contains(".test.")
        || base.ends_with("_test.rs")
        || base.ends_with("_test.go")
    {
        push_unique_string(&mut out, "tests");
    }
    if low.contains("/auth/")
        || low.contains("/oauth/")
        || low.contains("/jwt/")
        || low.contains("/session/")
        || low.contains("/rbac/")
        || low.contains("/acl/")
        || low.contains("/middleware/")
        || base.contains("auth")
        || base.contains("oauth")
        || base.contains("jwt")
        || base.contains("session")
    {
        push_unique_string(&mut out, "auth-surface");
    }
    if low.contains(".github/workflows/")
        || low.contains("/.circleci/")
        || low.contains("/ci/")
        || base == "dockerfile"
        || base == "docker-compose.yml"
        || base == "docker-compose.yaml"
    {
        push_unique_string(&mut out, "ci-build");
    }
    if base == ".env"
        || base.starts_with(".env.")
        || low.contains("/config/")
        || base.ends_with(".config.js")
        || base.ends_with(".config.ts")
        || base.ends_with(".config.cjs")
        || base.ends_with(".config.mjs")
        || base.ends_with(".toml")
        || base.ends_with(".yaml")
        || base.ends_with(".yml")
    {
        push_unique_string(&mut out, "config");
    }
    if low.contains("/docs/")
        || base == "readme.md"
        || base.ends_with(".md")
        || base.ends_with(".mdx")
    {
        push_unique_string(&mut out, "docs");
    }
    if low.ends_with(".rs") {
        push_unique_string(&mut out, "rust-source");
    }
    if is_jsish_source(rel) {
        push_unique_string(&mut out, "js-ts-source");
    }
    if out.is_empty() {
        push_unique_string(&mut out, "source");
    }
    out
}

fn build_changed_line_ranges(rows: &[DiffRow]) -> Vec<String> {
    let changed_indices: Vec<usize> = rows
        .iter()
        .enumerate()
        .filter(|(_, row)| row.is_changed && !row.is_truncation_marker)
        .map(|(index, _)| index)
        .collect();
    if changed_indices.is_empty() {
        return Vec::new();
    }
    let mut groups: Vec<(usize, usize)> = Vec::new();
    let mut start = changed_indices[0];
    let mut prev = changed_indices[0];
    for current in changed_indices.into_iter().skip(1) {
        if current == prev + 1 {
            prev = current;
            continue;
        }
        groups.push((start, prev));
        start = current;
        prev = current;
    }
    groups.push((start, prev));
    groups
        .into_iter()
        .map(|(start_idx, end_idx)| {
            let slice = &rows[start_idx..=end_idx];
            let left_nums: Vec<u32> = slice.iter().filter_map(|row| row.left_no).collect();
            let right_nums: Vec<u32> = slice.iter().filter_map(|row| row.right_no).collect();
            let left = line_range_label(
                left_nums.first().copied(),
                left_nums.last().copied(),
                "L",
            );
            let right = line_range_label(
                right_nums.first().copied(),
                right_nums.last().copied(),
                "R",
            );
            [left, right]
                .into_iter()
                .flatten()
                .collect::<Vec<_>>()
                .join(" / ")
        })
        .filter(|label| !label.is_empty())
        .take(8)
        .collect()
}

fn changed_lines_for_side(rows: &[DiffRow], side: &str) -> Vec<u32> {
    rows.iter()
        .filter(|row| row.is_changed && !row.is_truncation_marker)
        .filter_map(|row| {
            if side == "left" {
                row.left_no
            } else {
                row.right_no
            }
        })
        .collect()
}

fn collect_touched_symbols(
    symbols: &[DiffSymbolSpan],
    changed_lines: &[u32],
    side: &str,
) -> Vec<String> {
    let mut scored: Vec<(usize, u32, String)> = symbols
        .iter()
        .filter_map(|symbol| {
            let matched = changed_lines
                .iter()
                .filter(|line| **line >= symbol.start_line && **line <= symbol.end_line)
                .count();
            if matched == 0 {
                return None;
            }
            let span = symbol.end_line.saturating_sub(symbol.start_line);
            Some((
                matched,
                span,
                format!(
                    "{side} {} {} ({}-{})",
                    symbol.kind, symbol.name, symbol.start_line, symbol.end_line
                ),
            ))
        })
        .collect();
    scored.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.cmp(&b.1)).then_with(|| a.2.cmp(&b.2)));
    scored
        .into_iter()
        .map(|(_, _, label)| label)
        .take(8)
        .collect()
}

fn is_import_like_line(rel: &str, line: &str) -> bool {
    let trimmed = line.trim_start();
    let low = rel.to_ascii_lowercase();
    if is_jsish_source(rel) {
        return trimmed.starts_with("import ")
            || trimmed.starts_with("export * from ")
            || trimmed.contains("require(");
    }
    if low.ends_with(".rs") {
        return trimmed.starts_with("use ") || trimmed.starts_with("mod ") || trimmed.starts_with("pub mod ");
    }
    if low.ends_with(".py") {
        return trimmed.starts_with("import ") || trimmed.starts_with("from ");
    }
    if low.ends_with(".go") {
        return trimmed.starts_with("import ");
    }
    false
}

fn is_export_like_line(rel: &str, line: &str) -> bool {
    let trimmed = line.trim_start();
    let low = rel.to_ascii_lowercase();
    if is_jsish_source(rel) {
        return trimmed.starts_with("export ");
    }
    if low.ends_with(".rs") {
        return trimmed.starts_with("pub ");
    }
    false
}

fn collect_changed_decl_lines(payload: &FileDiffPayload, rel: &str, want_imports: bool) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for row in payload
        .rows
        .iter()
        .filter(|row| row.is_changed && !row.is_truncation_marker)
    {
        let candidate = if row.right_style == "added" && !row.right.trim().is_empty() {
            Some(("R", row.right_no, "added", row.right.as_str()))
        } else if row.left_style == "removed" && !row.left.trim().is_empty() {
            Some(("L", row.left_no, "removed", row.left.as_str()))
        } else {
            None
        };
        let Some((prefix, line_no, kind, text)) = candidate else {
            continue;
        };
        let matches_kind = if want_imports {
            is_import_like_line(rel, text)
        } else {
            is_export_like_line(rel, text)
        };
        if !matches_kind {
            continue;
        }
        let Some(line_no) = line_no else {
            continue;
        };
        let line = compact_snippet(text, 132);
        if line.is_empty() {
            continue;
        }
        let label = format!("{prefix}{line_no} {kind}: {line}");
        if !out.iter().any(|entry| entry == &label) {
            out.push(label);
        }
        if out.len() >= 6 {
            break;
        }
    }
    out
}

fn collect_cited_changed_lines(payload: &FileDiffPayload) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for row in payload
        .rows
        .iter()
        .filter(|row| row.is_changed && !row.is_truncation_marker)
    {
        let candidate = if row.right_style == "added" && !row.right.trim().is_empty() {
            Some(("R", row.right_no, "added", row.right.as_str()))
        } else if row.left_style == "removed" && !row.left.trim().is_empty() {
            Some(("L", row.left_no, "removed", row.left.as_str()))
        } else if !row.right.trim().is_empty() {
            Some(("R", row.right_no, "changed", row.right.as_str()))
        } else if !row.left.trim().is_empty() {
            Some(("L", row.left_no, "changed", row.left.as_str()))
        } else {
            None
        };
        let Some((prefix, line_no, kind, text)) = candidate else {
            continue;
        };
        let Some(line_no) = line_no else {
            continue;
        };
        let snippet = compact_snippet(text, 132);
        if snippet.is_empty() {
            continue;
        }
        let label = format!("{prefix}{line_no} {kind}: {snippet}");
        if !out.iter().any(|entry| entry == &label) {
            out.push(label);
        }
        if out.len() >= 6 {
            break;
        }
    }
    out
}

fn build_verification_hints(rel: &str, roles: &[String]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    if roles.iter().any(|role| role == "dependency-manifest" || role == "lockfile") {
        push_unique_string(
            &mut out,
            "Reinstall or refresh dependencies, then run the primary build/test pipeline.",
        );
    }
    if roles.iter().any(|role| role == "auth-surface") {
        push_unique_string(
            &mut out,
            "Run focused authentication/session regression checks for the touched flows.",
        );
    }
    if roles.iter().any(|role| role == "config") {
        push_unique_string(
            &mut out,
            "Validate startup/config loading with representative environment settings.",
        );
    }
    if roles.iter().any(|role| role == "ci-build") {
        push_unique_string(
            &mut out,
            "Exercise the build/release path or CI-equivalent commands before landing.",
        );
    }
    if roles.iter().any(|role| role == "tests") {
        push_unique_string(
            &mut out,
            "Re-run the affected tests and check whether fixtures or snapshots need refresh.",
        );
    }
    if rel.to_ascii_lowercase().ends_with(".rs")
        || roles.iter().any(|role| role == "rust-source")
    {
        push_unique_string(
            &mut out,
            "Run `cargo check` and `cargo test` for the touched Rust crates.",
        );
    }
    if is_jsish_source(rel) || rel.ends_with("package.json") {
        push_unique_string(
            &mut out,
            "Run the JS/TS lint, test, and production build commands used by this repo.",
        );
    }
    if out.is_empty() {
        push_unique_string(
            &mut out,
            "Run the nearest targeted tests and a quick manual smoke test for the touched area.",
        );
    }
    out.truncate(5);
    out
}

fn build_evidence_badges(
    roles: &[String],
    payload: &FileDiffPayload,
    touched_symbols: &[String],
    changed_imports: &[String],
    changed_exports: &[String],
) -> Vec<EvidenceBadge> {
    let mut out: Vec<EvidenceBadge> = Vec::new();
    let mut push = |key: &str, label: &str, tone: &str, description: Option<&str>| {
        if !out.iter().any(|badge| badge.key == key) {
            out.push(EvidenceBadge {
                key: key.to_string(),
                label: label.to_string(),
                tone: tone.to_string(),
                description: description.map(|value| value.to_string()),
            });
        }
    };
    if payload.truncated {
        push(
            "truncated-diff",
            "Truncated diff",
            "warn",
            Some("The diff rows were capped, so review conclusions should be treated as partial."),
        );
    }
    if !touched_symbols.is_empty() {
        push(
            "touched-symbols",
            "Touched symbols found",
            "good",
            Some("The summary can anchor to named symbols instead of only raw lines."),
        );
    }
    if roles.iter().any(|role| role == "dependency-manifest") {
        push(
            "dependency-manifest",
            "Dependency manifest changed",
            "warn",
            Some("Dependency surface or package metadata changed."),
        );
    }
    if roles.iter().any(|role| role == "lockfile") {
        push(
            "lockfile",
            "Lockfile changed",
            "warn",
            Some("Resolved dependency versions may have shifted."),
        );
    }
    if roles.iter().any(|role| role == "auth-surface") {
        push(
            "auth-surface",
            "Auth-adjacent path",
            "warn",
            Some("Authentication or access-control flows may be affected."),
        );
    }
    if roles.iter().any(|role| role == "config") {
        push(
            "config",
            "Config-adjacent path",
            "warn",
            Some("Runtime configuration or environment behavior may shift."),
        );
    }
    if roles.iter().any(|role| role == "tests") {
        push(
            "tests",
            "Test-related file",
            "good",
            Some("The diff directly touches test code or fixtures."),
        );
    }
    if !changed_imports.is_empty() || !changed_exports.is_empty() {
        push(
            "surface-change",
            "Import/export surface changed",
            "neutral",
            Some("Module wiring or public surface hints changed in the diff."),
        );
    }
    out
}

fn build_file_summary_evidence(rel: &str, payload: &FileDiffPayload) -> FileSummaryEvidence {
    let roles = detect_file_roles(rel);
    let changed_line_ranges = build_changed_line_ranges(&payload.rows);
    let left_lines = changed_lines_for_side(&payload.rows, "left");
    let right_lines = changed_lines_for_side(&payload.rows, "right");
    let mut touched_symbols = collect_touched_symbols(&payload.left_symbols, &left_lines, "left");
    touched_symbols.extend(collect_touched_symbols(
        &payload.right_symbols,
        &right_lines,
        "right",
    ));
    touched_symbols.truncate(8);
    let changed_imports = collect_changed_decl_lines(payload, rel, true);
    let changed_exports = collect_changed_decl_lines(payload, rel, false);
    let mut evidence_limits: Vec<String> = Vec::new();
    if payload.truncated {
        evidence_limits.push("Diff rows were truncated before the full file could be represented.".to_string());
    }
    if payload.left_symbols.is_empty() && payload.right_symbols.is_empty() {
        evidence_limits.push(
            "No named symbol spans were detected for this file with the current heuristic scanner."
                .to_string(),
        );
    }
    let cited_changed_lines = collect_cited_changed_lines(payload);
    let verification_hints = build_verification_hints(rel, &roles);
    let badges = build_evidence_badges(
        &roles,
        payload,
        &touched_symbols,
        &changed_imports,
        &changed_exports,
    );
    FileSummaryEvidence {
        file_roles: roles,
        touched_symbols,
        changed_line_ranges,
        changed_imports,
        changed_exports,
        cited_changed_lines,
        verification_hints,
        evidence_limits,
        badges,
    }
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
    let walker = WalkDir::new(root)
        .into_iter()
        .filter_entry(|e| walk_path_allowed(root, e.path()));
    for entry in walker.filter_map(|e| e.ok()) {
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
    let mut row_index = 0usize;

    for change in diff.iter_all_changes() {
        let raw = change.value().to_string();
        let line = raw.trim_end_matches('\n').to_string();
        let ln_l = change.old_index().map(|i| i as u32 + 1);
        let ln_r = change.new_index().map(|i| i as u32 + 1);
        match change.tag() {
            ChangeTag::Equal => {
                rows.push(DiffRow {
                    row_id: format!("r{row_index}"),
                    left_no: ln_l,
                    right_no: ln_r,
                    left: line.clone(),
                    right: line,
                    left_style: "equal",
                    right_style: "equal",
                    is_changed: false,
                    is_truncation_marker: false,
                });
            }
            ChangeTag::Delete => {
                dels += 1;
                rows.push(DiffRow {
                    row_id: format!("r{row_index}"),
                    left_no: ln_l,
                    right_no: None,
                    left: line,
                    right: String::new(),
                    left_style: "removed",
                    right_style: "empty",
                    is_changed: true,
                    is_truncation_marker: false,
                });
            }
            ChangeTag::Insert => {
                adds += 1;
                rows.push(DiffRow {
                    row_id: format!("r{row_index}"),
                    left_no: None,
                    right_no: ln_r,
                    left: String::new(),
                    right: line,
                    left_style: "empty",
                    right_style: "added",
                    is_changed: true,
                    is_truncation_marker: false,
                });
            }
        }
        row_index += 1;
        if rows.len() >= MAX_DIFF_ROWS {
            rows.push(DiffRow {
                row_id: format!("r{row_index}"),
                left_no: None,
                right_no: None,
                left: "… diff truncated (file too large)".into(),
                right: String::new(),
                left_style: "equal",
                right_style: "empty",
                is_changed: false,
                is_truncation_marker: true,
            });
            return FileDiffPayload {
                rows,
                truncated: true,
                line_additions: adds,
                line_deletions: dels,
                left_symbols: Vec::new(),
                right_symbols: Vec::new(),
                summary_evidence: empty_summary_evidence(),
            };
        }
    }

    FileDiffPayload {
        rows,
        truncated: false,
        line_additions: adds,
        line_deletions: dels,
        left_symbols: Vec::new(),
        right_symbols: Vec::new(),
        summary_evidence: empty_summary_evidence(),
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
    if is_novadiff_docs_reserved_rel(rel) {
        return Err("Path is under reserved novadiff-docs/ (generated documentation).".into());
    }

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

    let re_defs = OutlineDefRegexSet::new()?;
    let mut payload = line_diff_to_rows(&old_text, &new_text);
    payload.left_symbols = outline_extract_def_spans(rel, &old_text, &re_defs);
    payload.right_symbols = outline_extract_def_spans(rel, &new_text, &re_defs);
    payload.summary_evidence = build_file_summary_evidence(rel, &payload);
    Ok(payload)
}

fn change_kind_str(kind: ChangeKind) -> &'static str {
    match kind {
        ChangeKind::Added => "added",
        ChangeKind::Removed => "removed",
        ChangeKind::Modified => "modified",
    }
}

fn is_dependency_manifest_path(rel: &str) -> bool {
    detect_file_roles(rel)
        .iter()
        .any(|role| role == "dependency-manifest")
}

fn is_lockfile_path(rel: &str) -> bool {
    detect_file_roles(rel).iter().any(|role| role == "lockfile")
}

fn is_test_like_path(rel: &str) -> bool {
    detect_file_roles(rel).iter().any(|role| role == "tests")
}

fn is_auth_like_path(rel: &str) -> bool {
    detect_file_roles(rel)
        .iter()
        .any(|role| role == "auth-surface")
}

fn is_config_like_path(rel: &str) -> bool {
    detect_file_roles(rel).iter().any(|role| role == "config")
}

fn is_ci_build_like_path(rel: &str) -> bool {
    detect_file_roles(rel).iter().any(|role| role == "ci-build")
}

fn push_risk_signal(
    out: &mut Vec<RiskSignal>,
    category: &str,
    severity: &str,
    confidence: &str,
    rel_path: Option<String>,
    title: String,
    evidence: Vec<String>,
) {
    let rel_part = rel_path
        .as_ref()
        .map(|value| value.replace('/', "-"))
        .unwrap_or_else(|| "workspace".to_string());
    let id = format!(
        "{}:{}:{}",
        category,
        severity,
        compact_snippet(rel_part.as_str(), 48).replace(' ', "-")
    );
    if out.iter().any(|entry| entry.id == id) {
        return;
    }
    out.push(RiskSignal {
        id,
        source: "heuristic".to_string(),
        category: category.to_string(),
        severity: severity.to_string(),
        confidence: confidence.to_string(),
        title,
        rel_path,
        evidence,
        advisory: None,
    });
}

fn rust_added_unsafe_lines(payload: &FileDiffPayload) -> Vec<String> {
    payload
        .rows
        .iter()
        .filter(|row| row.right_style == "added" && !row.is_truncation_marker)
        .filter_map(|row| {
            let text = row.right.trim_start();
            let matches = text.contains("unsafe")
                || text.contains("extern \"")
                || text.contains("unsafe fn ");
            if !matches {
                return None;
            }
            row.right_no
                .map(|line_no| format!("R{line_no} added: {}", compact_snippet(text, 132)))
        })
        .take(6)
        .collect()
}

fn js_added_memory_leak_lines(payload: &FileDiffPayload) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut saw_set_interval = false;
    let mut saw_clear_interval = false;
    let mut saw_add_event_listener = false;
    let mut saw_remove_event_listener = false;
    for row in payload
        .rows
        .iter()
        .filter(|row| row.right_style == "added" && !row.is_truncation_marker)
    {
        let text = row.right.trim_start();
        if text.contains("setInterval(") {
            saw_set_interval = true;
            if let Some(no) = row.right_no {
                out.push(format!(
                    "R{no} added interval allocation: {}",
                    compact_snippet(text, 132)
                ));
            }
        }
        if text.contains("clearInterval(") {
            saw_clear_interval = true;
        }
        if text.contains("addEventListener(") {
            saw_add_event_listener = true;
            if let Some(no) = row.right_no {
                out.push(format!(
                    "R{no} added event subscription: {}",
                    compact_snippet(text, 132)
                ));
            }
        }
        if text.contains("removeEventListener(") {
            saw_remove_event_listener = true;
        }
    }
    if saw_set_interval && saw_clear_interval {
        out.retain(|line| !line.contains("interval allocation"));
    }
    if saw_add_event_listener && saw_remove_event_listener {
        out.retain(|line| !line.contains("event subscription"));
    }
    out.truncate(6);
    out
}

fn rust_added_memory_leak_lines(payload: &FileDiffPayload) -> Vec<String> {
    payload
        .rows
        .iter()
        .filter(|row| row.right_style == "added" && !row.is_truncation_marker)
        .filter_map(|row| {
            let text = row.right.trim_start();
            let matches = text.contains("Box::leak(")
                || text.contains("mem::forget(")
                || text.contains("ManuallyDrop::new(");
            if !matches {
                return None;
            }
            row.right_no
                .map(|line_no| format!("R{line_no} added: {}", compact_snippet(text, 132)))
        })
        .take(6)
        .collect()
}

fn added_incomplete_impl_lines(payload: &FileDiffPayload) -> Vec<String> {
    payload
        .rows
        .iter()
        .filter(|row| row.right_style == "added" && !row.is_truncation_marker)
        .filter_map(|row| {
            let text = row.right.trim_start();
            let low = text.to_ascii_lowercase();
            let looks_incomplete = low.contains("todo!")
                || low.contains("todo(")
                || low.contains("notimplemented")
                || low.contains("unimplemented!")
                || low.contains("throw new error(\"todo")
                || low.contains("throw new error('todo")
                || low.contains("return null; // todo")
                || low.contains("fixme");
            if !looks_incomplete {
                return None;
            }
            row.right_no
                .map(|line_no| format!("R{line_no} incomplete stub: {}", compact_snippet(text, 132)))
        })
        .take(6)
        .collect()
}

fn added_export_surface_lines(rel: &str, payload: &FileDiffPayload) -> Vec<String> {
    payload
        .rows
        .iter()
        .filter(|row| row.right_style == "added" && !row.is_truncation_marker)
        .filter_map(|row| {
            let text = row.right.trim_start();
            let looks_export = is_export_like_line(rel, text)
                || text.starts_with("pub fn ")
                || text.starts_with("pub async fn ")
                || text.starts_with("pub(crate) fn ")
                || text.starts_with("export function ")
                || text.starts_with("export async function ");
            if !looks_export {
                return None;
            }
            row.right_no.map(|line_no| format!(
                "R{line_no} export surface added: {}",
                compact_snippet(text, 132)
            ))
        })
        .take(6)
        .collect()
}

fn config_security_hint_lines(payload: &FileDiffPayload) -> Vec<String> {
    payload
        .rows
        .iter()
        .filter(|row| row.right_style == "added" && !row.is_truncation_marker)
        .filter_map(|row| {
            let text = row.right.trim_start();
            let low = text.to_ascii_lowercase();
            let suspicious = low.contains("node_tls_reject_unauthorized=0")
                || low.contains("disable_ssl")
                || low.contains("allow_insecure")
                || low.contains("allow-origin: *")
                || low.contains("access-control-allow-origin: *")
                || low.contains("cors=*")
                || low.contains("debug=true")
                || low.contains("allow_anonymous=true");
            if !suspicious {
                return None;
            }
            row.right_no
                .map(|line_no| format!("R{line_no} security-sensitive config: {}", compact_snippet(text, 132)))
        })
        .take(6)
        .collect()
}

fn risk_signals(
    left_root: &str,
    right_root: &str,
    changes: &[FileChange],
) -> Result<Vec<RiskSignal>, String> {
    let mut out: Vec<RiskSignal> = Vec::new();
    let mut manifest_paths: Vec<String> = Vec::new();
    let mut lockfile_paths: Vec<String> = Vec::new();
    let has_any_test_change = changes
        .iter()
        .any(|change| is_test_like_path(change.path.as_str()));
    let mut saw_test_change = false;
    let mut saw_non_test_change = false;
    for change in changes {
        let rel = change.path.trim();
        if rel.is_empty() || is_novadiff_docs_reserved_rel(rel) {
            continue;
        }
        if is_test_like_path(rel) {
            saw_test_change = true;
        } else {
            saw_non_test_change = true;
        }
        if is_dependency_manifest_path(rel) {
            manifest_paths.push(rel.to_string());
            push_risk_signal(
                &mut out,
                "dependency",
                "medium",
                "high",
                Some(rel.to_string()),
                format!("Dependency manifest {} in `{rel}`", change_kind_str(change.kind)),
                vec![
                    "Dependency manifest files can change install/build behavior.".to_string(),
                    format!("Change kind: {}", change_kind_str(change.kind)),
                ],
            );
        }
        if is_lockfile_path(rel) {
            lockfile_paths.push(rel.to_string());
            push_risk_signal(
                &mut out,
                "dependency",
                "medium",
                "high",
                Some(rel.to_string()),
                format!("Lockfile {} in `{rel}`", change_kind_str(change.kind)),
                vec![
                    "Resolved dependency versions may have changed.".to_string(),
                    format!("Change kind: {}", change_kind_str(change.kind)),
                ],
            );
        }
        if is_auth_like_path(rel) {
            push_risk_signal(
                &mut out,
                "auth",
                "medium",
                "medium",
                Some(rel.to_string()),
                format!("Auth-adjacent path touched: `{rel}`"),
                vec![
                    "Authentication/session/access-control paths deserve focused regression checks."
                        .to_string(),
                ],
            );
        }
        if is_config_like_path(rel) {
            push_risk_signal(
                &mut out,
                "config",
                "medium",
                "medium",
                Some(rel.to_string()),
                format!("Config-adjacent file touched: `{rel}`"),
                vec![
                    "Configuration or environment behavior may change across deploy targets."
                        .to_string(),
                ],
            );
        }
        if is_ci_build_like_path(rel) {
            push_risk_signal(
                &mut out,
                "build",
                "medium",
                "medium",
                Some(rel.to_string()),
                format!("Build/CI surface touched: `{rel}`"),
                vec![
                    "Build and release automation should be exercised after this change.".to_string(),
                ],
            );
        }
        if is_test_like_path(rel) && matches!(change.kind, ChangeKind::Removed) {
            push_risk_signal(
                &mut out,
                "tests",
                "high",
                "high",
                Some(rel.to_string()),
                format!("Test file removed: `{rel}`"),
                vec!["Removed tests reduce regression coverage for nearby changes.".to_string()],
            );
        }
        let rel_low = rel.to_ascii_lowercase();
        let needs_payload = rel_low.ends_with(".rs") || is_jsish_source(rel) || is_config_like_path(rel);
        if needs_payload {
            let payload = get_file_diff(left_root, right_root, rel, change_kind_str(change.kind))?;
            let incomplete_lines = added_incomplete_impl_lines(&payload);
            if !incomplete_lines.is_empty() {
                push_risk_signal(
                    &mut out,
                    "function-completeness",
                    "medium",
                    "medium",
                    Some(rel.to_string()),
                    format!("Potentially incomplete implementation in `{rel}`"),
                    incomplete_lines,
                );
            }
            let added_exports = added_export_surface_lines(rel, &payload);
            if !added_exports.is_empty() && !has_any_test_change {
                let mut evidence = added_exports;
                evidence.push(
                    "No changed test files were detected while new/changed exported surface was added."
                        .to_string(),
                );
                push_risk_signal(
                    &mut out,
                    "function-completeness",
                    "medium",
                    "low",
                    Some(rel.to_string()),
                    format!("Exported surface changed without matching test updates in `{rel}`"),
                    evidence,
                );
            }
            if is_jsish_source(rel) {
                let js_leaks = js_added_memory_leak_lines(&payload);
                if !js_leaks.is_empty() {
                    push_risk_signal(
                        &mut out,
                        "memory-leak",
                        "medium",
                        "medium",
                        Some(rel.to_string()),
                        format!("Potential event/timer cleanup gap in `{rel}`"),
                        js_leaks,
                    );
                }
            }
            if is_config_like_path(rel) {
                let config_hints = config_security_hint_lines(&payload);
                if !config_hints.is_empty() {
                    push_risk_signal(
                        &mut out,
                        "config",
                        "high",
                        "medium",
                        Some(rel.to_string()),
                        format!("Security-sensitive config defaults changed in `{rel}`"),
                        config_hints,
                    );
                }
            }
        }
        if rel_low.ends_with(".rs") {
            let payload = get_file_diff(left_root, right_root, rel, change_kind_str(change.kind))?;
            let unsafe_lines = rust_added_unsafe_lines(&payload);
            if !unsafe_lines.is_empty() {
                push_risk_signal(
                    &mut out,
                    "unsafe-rust",
                    "high",
                    "high",
                    Some(rel.to_string()),
                    format!("Unsafe Rust detected in `{rel}`"),
                    unsafe_lines,
                );
            }
            let leak_lines = rust_added_memory_leak_lines(&payload);
            if !leak_lines.is_empty() {
                push_risk_signal(
                    &mut out,
                    "memory-leak",
                    "high",
                    "high",
                    Some(rel.to_string()),
                    format!("Potential Rust lifetime leak pattern in `{rel}`"),
                    leak_lines,
                );
            }
        }
    }
    if saw_non_test_change && !saw_test_change {
        push_risk_signal(
            &mut out,
            "tests",
            "medium",
            "medium",
            None,
            "No changed test files detected in this compare".to_string(),
            vec![
                "Code changed outside test paths, so verification may rely on existing coverage only."
                    .to_string(),
            ],
        );
    }
    if !manifest_paths.is_empty() && lockfile_paths.is_empty() {
        push_risk_signal(
            &mut out,
            "dependency",
            "medium",
            "medium",
            None,
            "Dependency manifests changed without a lockfile update".to_string(),
            manifest_paths
                .iter()
                .take(6)
                .map(|path| format!("Manifest changed: `{path}`"))
                .collect(),
        );
    }
    if manifest_paths.is_empty() && !lockfile_paths.is_empty() {
        push_risk_signal(
            &mut out,
            "dependency",
            "low",
            "medium",
            None,
            "Lockfiles changed without manifest edits".to_string(),
            lockfile_paths
                .iter()
                .take(6)
                .map(|path| format!("Lockfile changed: `{path}`"))
                .collect(),
        );
    }
    out.sort_by(|a, b| {
        let sev = |value: &str| match value {
            "high" => 0usize,
            "medium" => 1usize,
            _ => 2usize,
        };
        sev(&a.severity)
            .cmp(&sev(&b.severity))
            .then_with(|| a.category.cmp(&b.category))
            .then_with(|| a.title.cmp(&b.title))
    });
    Ok(out)
}

fn outline_file_extension(rel: &str) -> String {
    let base = rel.rsplit_once('/').map(|(_, b)| b).unwrap_or(rel);
    if base.starts_with('.') {
        return "(no ext)".into();
    }
    if let Some(i) = base.rfind('.') {
        if i > 0 && i + 1 < base.len() {
            return base[i..].to_lowercase();
        }
    }
    "(no ext)".into()
}

fn read_bytes_cap(path: &Path, cap: usize) -> Result<Vec<u8>, String> {
    let mut f = File::open(path).map_err(|e| e.to_string())?;
    let mut buf = vec![0u8; cap];
    let n = f.read(&mut buf).map_err(|e| e.to_string())?;
    buf.truncate(n);
    Ok(buf)
}

fn normalize_joined_path(path: &Path) -> String {
    let mut out = PathBuf::new();
    for c in path.components() {
        match c {
            Component::CurDir => {}
            Component::ParentDir => {
                let _ = out.pop();
            }
            Component::Normal(os) => out.push(os),
            _ => {}
        }
    }
    out.to_string_lossy().replace('\\', "/")
}

fn resolve_relative_import(from_rel: &str, spec: &str, files: &HashSet<String>) -> Option<String> {
    if !spec.starts_with('.') {
        return None;
    }
    let parent = Path::new(from_rel).parent().unwrap_or_else(|| Path::new(""));
    let joined = parent.join(spec);
    let key = normalize_joined_path(&joined);
    if files.contains(&key) {
        return Some(key);
    }
    for suf in [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] {
        let k = format!("{key}{suf}");
        if files.contains(&k) {
            return Some(k);
        }
    }
    for suf in ["/index.ts", "/index.tsx", "/index.js", "/index.jsx"] {
        let k = format!("{key}{suf}");
        if files.contains(&k) {
            return Some(k);
        }
    }
    None
}

fn mermaid_escape_label(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            '"' => '\'',
            '\n' | '\r' => ' ',
            _ => c,
        })
        .take(52)
        .collect()
}

fn mermaid_node_id(path: &str) -> String {
    let mut id: String = path
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect();
    if id.is_empty() {
        id = "n".into();
    }
    if id.chars().next().map(|c| c.is_numeric()).unwrap_or(false) {
        id = format!("_{}", id);
    }
    id
}

fn is_call_stopword(s: &str) -> bool {
    matches!(
        s,
        "if" | "for" | "while" | "switch" | "catch" | "match" | "return" | "throw"
            | "sizeof" | "typeof" | "new" | "await" | "yield" | "case" | "else" | "super"
            | "try" | "except" | "with" | "lambda" | "def" | "async" | "import" | "from"
            | "fn" | "let" | "mut" | "const" | "static" | "public" | "private" | "struct"
            | "enum" | "impl" | "trait" | "class" | "interface" | "void" | "int" | "var"
            | "dynamic" | "global" | "using" | "where" | "select" | "include" | "define"
            | "ifdef" | "endif" | "pragma" | "package" | "extends" | "implements" | "goto"
            | "break" | "continue" | "default" | "do" | "union" | "typedef" | "namespace"
            | "template" | "typename" | "decltype" | "alignof" | "typeid" | "and"
            | "or" | "not" | "in" | "is" | "as" | "pass" | "del" | "raise" | "assert" | "print"
            | "echo" | "empty" | "isset" | "unset" | "list" | "array" | "foreach"
            | "defer" | "go" | "chan" | "map" | "range" | "make" | "append" | "panic" | "recover"
            | "nil" | "true" | "false" | "null" | "None" | "Some" | "Ok" | "Err" | "Self"
    )
}

/// Broad “source-like” path for cross-file call heuristics (regex-only, not AST).
fn is_outline_call_scan(rel: &str) -> bool {
    if is_jsish_source(rel) {
        return true;
    }
    let e = outline_file_extension(rel);
    matches!(
        e.as_str(),
        ".rs" | ".py" | ".go" | ".java" | ".kt" | ".kts" | ".cs" | ".swift" | ".php"
            | ".c" | ".cpp" | ".cc" | ".cxx" | ".h" | ".hpp" | ".hh" | ".m" | ".mm" | ".cls"
            | ".apex" | ".scala" | ".groovy" | ".rb" | ".ex" | ".exs" | ".erl" | ".hrl"
    )
}

fn detect_detected_projects(files: &HashSet<String>) -> Vec<serde_json::Value> {
    let mut out: Vec<serde_json::Value> = Vec::new();
    let mut push = |kind: &str, markers: Vec<String>| {
        out.push(serde_json::json!({ "kind": kind, "markers": markers }));
    };
    if files.contains("Cargo.toml") {
        push("rust", vec!["Cargo.toml".into()]);
    }
    if files.contains("package.json") {
        push("node", vec!["package.json".into()]);
    }
    if files.contains("go.mod") {
        push("go", vec!["go.mod".into()]);
    }
    let mut py_m: Vec<String> = Vec::new();
    for marker in [
        "pyproject.toml",
        "setup.py",
        "requirements.txt",
        "Pipfile",
        "poetry.lock",
        "uv.lock",
    ] {
        if files.contains(marker) {
            py_m.push((*marker).into());
        }
    }
    if !py_m.is_empty() {
        push("python", py_m);
    }
    if files.contains("pom.xml") {
        push("java_maven", vec!["pom.xml".into()]);
    }
    if files.contains("build.gradle")
        || files.contains("build.gradle.kts")
        || files.contains("settings.gradle.kts")
    {
        let mut m = Vec::new();
        for p in ["build.gradle", "build.gradle.kts", "settings.gradle.kts"] {
            if files.contains(p) {
                m.push((*p).into());
            }
        }
        push("gradle", m);
    }
    if files.contains("composer.json") {
        push("php", vec!["composer.json".into()]);
    }
    if files.contains("Gemfile") {
        push("ruby", vec!["Gemfile".into()]);
    }
    if files.contains("Package.swift") {
        push("swift_pm", vec!["Package.swift".into()]);
    }
    if files.contains("CMakeLists.txt") {
        push("cmake", vec!["CMakeLists.txt".into()]);
    }
    if files.contains("conanfile.txt") || files.contains("conanfile.py") {
        push("conan", vec!["conanfile".into()]);
    }
    if files.contains("sfdx-project.json") || files.iter().any(|p| p.starts_with("force-app/")) {
        push(
            "salesforce",
            vec!["sfdx-project.json or force-app/".into()],
        );
    }
    if files.iter().any(|p| p.contains(".xcodeproj/")) {
        push("xcode", vec!["*.xcodeproj/".into()]);
    }
    if files.contains("ProjectSettings/ProjectVersion.txt") {
        push("unity", vec!["ProjectSettings/ProjectVersion.txt".into()]);
    }
    if files.iter().any(|p| p.ends_with("AndroidManifest.xml")) {
        push("android", vec!["AndroidManifest.xml".into()]);
    }
    let csproj: Vec<String> = files
        .iter()
        .filter(|p| p.ends_with(".csproj"))
        .cloned()
        .take(16)
        .collect();
    if !csproj.is_empty() {
        push("dotnet", csproj);
    }
    out.sort_by(|a, b| {
        let ka = a.get("kind").and_then(|x| x.as_str()).unwrap_or("");
        let kb = b.get("kind").and_then(|x| x.as_str()).unwrap_or("");
        ka.cmp(kb)
    });
    out
}

struct OutlineDefRegexSet {
    js_fn: Regex,
    js_arrow: Regex,
    ts_class: Regex,
    ts_iface: Regex,
    rs_fn: Regex,
    rs_struct: Regex,
    rs_enum: Regex,
    py_def: Regex,
    go_fn: Regex,
    go_meth: Regex,
    javaish: Regex,
    kt_fun: Regex,
    cs_meth: Regex,
    php_fn: Regex,
    swift_fun: Regex,
    swift_class: Regex,
    c_fn: Regex,
    rb_def: Regex,
    ex_def: Regex,
    call_word: Regex,
}

impl OutlineDefRegexSet {
    fn new() -> Result<Self, String> {
        Ok(Self {
            js_fn: Regex::new(r"(?m)^(?:export\s+)?(?:async\s+)?function\s+(\w+)")
                .map_err(|e| e.to_string())?,
            js_arrow: Regex::new(r"(?m)^export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(")
                .map_err(|e| e.to_string())?,
            ts_class: Regex::new(r"(?m)^export\s+class\s+(\w+)").map_err(|e| e.to_string())?,
            ts_iface: Regex::new(r"(?m)^(?:export\s+)?interface\s+(\w+)")
                .map_err(|e| e.to_string())?,
            rs_fn: Regex::new(r"(?m)^\s*(?:pub(?:\([^)]*\))?\s+)?fn\s+(\w+)\s*[\(<]")
                .map_err(|e| e.to_string())?,
            rs_struct: Regex::new(r"(?m)^\s*pub\s+struct\s+(\w+)").map_err(|e| e.to_string())?,
            rs_enum: Regex::new(r"(?m)^\s*(?:pub\s+)?enum\s+(\w+)").map_err(|e| e.to_string())?,
            py_def: Regex::new(r"(?m)^\s*(?:async\s+)?def\s+(\w+)\s*\(").map_err(|e| e.to_string())?,
            go_fn: Regex::new(r"(?m)^\s*func\s+(\w+)\s*\(").map_err(|e| e.to_string())?,
            go_meth: Regex::new(r"(?m)^\s*func\s+\([^)]*\)\s+(\w+)\s*\(")
                .map_err(|e| e.to_string())?,
            javaish: Regex::new(
                r"(?m)^\s*(?:@\w+(?:\([^)]*\))?\s+)*(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:abstract\s+)?(?:[\w.<>\[\]]+\s+)+(\w+)\s*\(",
            )
            .map_err(|e| e.to_string())?,
            kt_fun: Regex::new(
                r"(?m)^\s*(?:@\S+(?:\s+\S+)*\s+)*(?:internal\s+|private\s+|public\s+|protected\s+)?(?:inline\s+)?(?:suspend\s+)?fun\s+(\w+)\s*[<(]",
            )
            .map_err(|e| e.to_string())?,
            cs_meth: Regex::new(
                r"(?m)^\s*(?:public|private|protected|internal)\s+(?:static\s+)?(?:async\s+)?(?:virtual\s+)?(?:override\s+)?(?:[\w.<>\[\]]+\s+)+(\w+)\s*\(",
            )
            .map_err(|e| e.to_string())?,
            php_fn: Regex::new(r"(?m)^\s*function\s+(\w+)\s*\(").map_err(|e| e.to_string())?,
            swift_fun: Regex::new(
                r"(?m)^\s*(?:public|private|internal|open|fileprivate)?\s*func\s+(\w+)\s*[<(]",
            )
            .map_err(|e| e.to_string())?,
            swift_class: Regex::new(
                r"(?m)^\s*(?:public|private|internal|open|fileprivate)?\s*class\s+(\w+)",
            )
            .map_err(|e| e.to_string())?,
            c_fn: Regex::new(
                r"(?m)^\s*(?:static\s+)?(?:inline\s+)?(?:unsigned\s+|signed\s+)?(?:void|int|char|short|long|float|double|bool|size_t|auto|constexpr)\b(?:\s*\*?\s*|\s+)\s*(\w+)\s*\(",
            )
            .map_err(|e| e.to_string())?,
            rb_def: Regex::new(r"(?m)^\s*def\s+(\w+)\s*[(\s]").map_err(|e| e.to_string())?,
            ex_def: Regex::new(r"(?m)^\s*def\s+(\w+)\s*(?:\(|\s+do\b)")
                .map_err(|e| e.to_string())?,
            call_word: Regex::new(r"(?m)(?:^|[^.\w])([A-Za-z_]\w*)\s*\(")
                .map_err(|e| e.to_string())?,
        })
    }
}

fn line_number_at_byte(text: &str, byte_offset: usize) -> u32 {
    text[..byte_offset].bytes().filter(|b| *b == b'\n').count() as u32 + 1
}

fn finalize_symbol_spans(mut spans: Vec<DiffSymbolSpan>, total_lines: u32) -> Vec<DiffSymbolSpan> {
    spans.sort_by(|a, b| {
        a.start_line
            .cmp(&b.start_line)
            .then_with(|| a.name.cmp(&b.name))
            .then_with(|| a.kind.cmp(&b.kind))
    });
    spans.dedup_by(|a, b| {
        a.start_line == b.start_line && a.name == b.name && a.kind == b.kind
    });
    for i in 0..spans.len() {
        let next_start = spans.get(i + 1).map(|s| s.start_line);
        let start = spans[i].start_line.max(1);
        spans[i].end_line = next_start
            .map(|line| line.saturating_sub(1).max(start))
            .unwrap_or_else(|| total_lines.max(start));
    }
    spans.truncate(96);
    spans
}

fn parent_symbol_for_span<'a>(
    spans: &'a [DiffSymbolSpan],
    target: &DiffSymbolSpan,
) -> Option<&'a DiffSymbolSpan> {
    spans.iter()
        .filter(|span| {
            span.name != target.name
                && span.start_line <= target.start_line
                && span.end_line >= target.end_line
                && (span.start_line != target.start_line || span.end_line != target.end_line)
        })
        .min_by(|a, b| {
            let ar = a.end_line.saturating_sub(a.start_line);
            let br = b.end_line.saturating_sub(b.start_line);
            ar.cmp(&br)
                .then_with(|| a.start_line.cmp(&b.start_line))
                .then_with(|| a.name.cmp(&b.name))
        })
}

fn outline_push_def_spans(
    out: &mut Vec<DiffSymbolSpan>,
    re: &Regex,
    text: &str,
    kind: &str,
) {
    for caps in re.captures_iter(text) {
        if let (Some(name_m), Some(full_m)) = (caps.get(1), caps.get(0)) {
            let name = name_m.as_str();
            if name.len() >= 2 && name.len() < 80 {
                out.push(DiffSymbolSpan {
                    name: name.to_string(),
                    kind: kind.to_string(),
                    start_line: line_number_at_byte(text, full_m.start()),
                    end_line: 0,
                });
            }
        }
    }
}

fn outline_extract_def_spans(rel: &str, text: &str, re: &OutlineDefRegexSet) -> Vec<DiffSymbolSpan> {
    let mut spans: Vec<DiffSymbolSpan> = Vec::new();
    let low = rel.to_ascii_lowercase();
    if is_jsish_source(rel) {
        outline_push_def_spans(&mut spans, &re.js_fn, text, "function");
        outline_push_def_spans(&mut spans, &re.js_arrow, text, "function");
        outline_push_def_spans(&mut spans, &re.ts_class, text, "class");
        outline_push_def_spans(&mut spans, &re.ts_iface, text, "interface");
    }
    if low.ends_with(".rs") {
        outline_push_def_spans(&mut spans, &re.rs_fn, text, "function");
        outline_push_def_spans(&mut spans, &re.rs_struct, text, "struct");
        outline_push_def_spans(&mut spans, &re.rs_enum, text, "enum");
    }
    if low.ends_with(".py") {
        outline_push_def_spans(&mut spans, &re.py_def, text, "function");
    }
    if low.ends_with(".go") {
        outline_push_def_spans(&mut spans, &re.go_fn, text, "function");
        outline_push_def_spans(&mut spans, &re.go_meth, text, "method");
    }
    if low.ends_with(".java") || low.ends_with(".cls") || low.ends_with(".apex") {
        outline_push_def_spans(&mut spans, &re.javaish, text, "method");
    }
    if low.ends_with(".kt") || low.ends_with(".kts") {
        outline_push_def_spans(&mut spans, &re.kt_fun, text, "function");
        outline_push_def_spans(&mut spans, &re.javaish, text, "method");
    }
    if low.ends_with(".cs") {
        outline_push_def_spans(&mut spans, &re.cs_meth, text, "method");
    }
    if low.ends_with(".php") {
        outline_push_def_spans(&mut spans, &re.php_fn, text, "function");
    }
    if low.ends_with(".swift") {
        outline_push_def_spans(&mut spans, &re.swift_fun, text, "function");
        outline_push_def_spans(&mut spans, &re.swift_class, text, "class");
    }
    if low.ends_with(".c")
        || low.ends_with(".h")
        || low.ends_with(".cpp")
        || low.ends_with(".cc")
        || low.ends_with(".cxx")
        || low.ends_with(".hpp")
        || low.ends_with(".hh")
    {
        outline_push_def_spans(&mut spans, &re.c_fn, text, "function");
    }
    if low.ends_with(".rb") {
        outline_push_def_spans(&mut spans, &re.rb_def, text, "function");
    }
    if low.ends_with(".ex") || low.ends_with(".exs") {
        outline_push_def_spans(&mut spans, &re.ex_def, text, "function");
    }
    let total_lines = text.lines().count().max(1) as u32;
    finalize_symbol_spans(spans, total_lines)
}

fn outline_extract_call_names(text: &str, re: &OutlineDefRegexSet) -> Vec<String> {
    let mut v: Vec<String> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    for caps in re.call_word.captures_iter(text) {
        if let Some(m) = caps.get(1) {
            let id = m.as_str();
            if id.len() < 2 || id.len() > 64 {
                continue;
            }
            let low = id.to_ascii_lowercase();
            if is_call_stopword(&low) {
                continue;
            }
            if seen.insert(low.clone()) {
                v.push(id.to_string());
            }
        }
    }
    v
}

fn is_jsish_source(rel: &str) -> bool {
    rel.ends_with(".ts")
        || rel.ends_with(".tsx")
        || rel.ends_with(".js")
        || rel.ends_with(".jsx")
        || rel.ends_with(".mjs")
        || rel.ends_with(".cjs")
}

fn codebase_outline(root_str: &str) -> Result<serde_json::Value, String> {
    const OUTLINE_READ_CAP: usize = 56 * 1024;
    const MAX_IMPORT_FILES: usize = 120;
    const MAX_IMPORT_EDGES: usize = 500;
    const MAX_SYM_FILES: usize = 160;
    const MAX_SYM_PER_FILE: usize = 28;

    let root_pb = PathBuf::from(root_str.trim());
    let map = collect_files(&root_pb)?;
    let files_set: HashSet<String> = map.keys().cloned().collect();
    let total = map.len();

    let mut by_ext: HashMap<String, usize> = HashMap::new();
    let mut by_top: HashMap<String, usize> = HashMap::new();
    for rel in map.keys() {
        let e = outline_file_extension(rel);
        *by_ext.entry(e).or_insert(0) += 1;
        let top = rel
            .find('/')
            .map(|i| rel[..i].to_string())
            .unwrap_or_else(|| ".".to_string());
        *by_top.entry(top).or_insert(0) += 1;
    }

    let mut ext_vec: Vec<(String, usize)> = by_ext.into_iter().collect();
    ext_vec.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    ext_vec.truncate(32);

    let mut top_vec: Vec<(String, usize)> = by_top.into_iter().collect();
    top_vec.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    top_vec.truncate(24);

    let re_from = Regex::new(r#"from\s+["'](\.[^"']+)["']"#).map_err(|e| e.to_string())?;
    let re_dyn_import =
        Regex::new(r#"import\s*\(\s*["'](\.[^"']+)["']\s*\)"#).map_err(|e| e.to_string())?;
    let re_require = Regex::new(r#"require\s*\(\s*["'](\.[^"']+)["']\s*\)"#).map_err(|e| e.to_string())?;
    let re_defs = OutlineDefRegexSet::new()?;

    let detected_projects = detect_detected_projects(&files_set);

    let mut import_edges: Vec<serde_json::Value> = Vec::new();
    let mut seen_edge: HashSet<(String, String)> = HashSet::new();

    let mut rels_sorted: Vec<String> = map.keys().cloned().collect();
    rels_sorted.sort();

    let mut import_file_count = 0usize;
    for rel in &rels_sorted {
        if import_edges.len() >= MAX_IMPORT_EDGES || import_file_count >= MAX_IMPORT_FILES {
            break;
        }
        if !is_jsish_source(rel) {
            continue;
        }
        import_file_count += 1;
        let Some(path) = map.get(rel) else {
            continue;
        };
        let Ok(raw) = read_bytes_cap(path, OUTLINE_READ_CAP) else {
            continue;
        };
        let text = String::from_utf8_lossy(&raw);
        for re in [&re_from, &re_dyn_import, &re_require] {
            for cap in re.captures_iter(&text) {
                if let Some(m) = cap.get(1) {
                    if let Some(to) = resolve_relative_import(rel, m.as_str(), &files_set) {
                        let key = (rel.clone(), to.clone());
                        if seen_edge.insert(key) {
                            import_edges.push(serde_json::json!({
                                "from": rel,
                                "to": to,
                            }));
                        }
                    }
                }
            }
        }
    }

    let mut def_index: HashMap<String, Vec<(String, String)>> = HashMap::new();
    let mut symbols: Vec<serde_json::Value> = Vec::new();
    let mut symbol_spans_by_file: Vec<serde_json::Value> = Vec::new();
    let mut symbol_count_by_path: HashMap<String, usize> = HashMap::new();
    let mut line_count_by_path: HashMap<String, u32> = HashMap::new();
    let mut sym_files = 0usize;
    for rel in &rels_sorted {
        if sym_files >= MAX_SYM_FILES {
            break;
        }
        if !is_outline_call_scan(rel) {
            continue;
        }
        let Some(path) = map.get(rel) else {
            continue;
        };
        let Ok(raw) = read_bytes_cap(path, OUTLINE_READ_CAP) else {
            continue;
        };
        sym_files += 1;
        let text = String::from_utf8_lossy(&raw);
        let total_lines = text.lines().count().max(1) as u32;
        line_count_by_path.insert(rel.clone(), total_lines);
        let spans = outline_extract_def_spans(rel, &text, &re_defs);
        symbol_count_by_path.insert(rel.clone(), spans.len());
        let names: Vec<String> = spans.iter().map(|span| span.name.clone()).collect();
        for d in &names {
            def_index
                .entry(d.to_lowercase())
                .or_default()
                .push((rel.clone(), d.clone()));
        }
        let mut sn = names;
        sn.truncate(MAX_SYM_PER_FILE);
        if !sn.is_empty() {
            symbols.push(serde_json::json!({ "path": rel, "symbols": sn }));
        }
        if !spans.is_empty() {
            let symbol_entries = spans
                .iter()
                .map(|span| {
                    let parent = parent_symbol_for_span(&spans, span);
                    serde_json::json!({
                        "path": rel,
                        "name": span.name,
                        "kind": span.kind,
                        "start_line": span.start_line,
                        "end_line": span.end_line,
                        "line_count": span.end_line.saturating_sub(span.start_line).saturating_add(1),
                        "parent_name": parent.map(|p| p.name.clone()),
                        "parent_kind": parent.map(|p| p.kind.clone()),
                        "container_kind": if parent.is_some() { "symbol" } else { "file" },
                    })
                })
                .collect::<Vec<_>>();
            symbol_spans_by_file.push(serde_json::json!({
                "path": rel,
                "line_count": total_lines,
                "symbols": symbol_entries,
            }));
        }
    }

    let mut call_edges: Vec<serde_json::Value> = Vec::new();
    let mut seen_call: HashSet<(String, String, String)> = HashSet::new();
    const MAX_CALL_FILES: usize = 220;
    const MAX_CALL_EDGES: usize = 220;
    let mut ncall_files = 0usize;
    for rel in &rels_sorted {
        if call_edges.len() >= MAX_CALL_EDGES || ncall_files >= MAX_CALL_FILES {
            break;
        }
        if !is_outline_call_scan(rel) {
            continue;
        }
        let Some(path) = map.get(rel) else {
            continue;
        };
        let Ok(raw) = read_bytes_cap(path, OUTLINE_READ_CAP) else {
            continue;
        };
        ncall_files += 1;
        let text = String::from_utf8_lossy(&raw);
        for id in outline_extract_call_names(&text, &re_defs) {
            if let Some(v) = def_index.get(&id.to_lowercase()) {
                if v.len() == 1 {
                    let (to_rel, _) = &v[0];
                    if to_rel.as_str() != rel.as_str() {
                        let key = (rel.clone(), to_rel.clone(), id.clone());
                        if seen_call.insert(key) {
                            call_edges.push(serde_json::json!({
                                "from_file": rel,
                                "to_file": to_rel,
                                "via": id,
                            }));
                        }
                    }
                }
            }
        }
    }

    let mut graph_lines = vec!["flowchart LR".to_string()];
    for e in import_edges.iter().take(72) {
        let from = e.get("from").and_then(|x| x.as_str()).unwrap_or("");
        let to = e.get("to").and_then(|x| x.as_str()).unwrap_or("");
        let id1 = mermaid_node_id(from);
        let id2 = mermaid_node_id(to);
        graph_lines.push(format!(
            r#"  {}["{}"] --> {}["{}"]"#,
            id1,
            mermaid_escape_label(from),
            id2,
            mermaid_escape_label(to)
        ));
    }
    let import_graph_mermaid = if graph_lines.len() > 1 {
        graph_lines.join("\n")
    } else {
        "flowchart TB\n  empty[No relative import edges in scanned JS/TS files]".into()
    };

    let mut call_graph_lines = vec!["flowchart LR".to_string()];
    for e in call_edges.iter().take(96) {
        let from = e.get("from_file").and_then(|x| x.as_str()).unwrap_or("");
        let to = e.get("to_file").and_then(|x| x.as_str()).unwrap_or("");
        let via = e.get("via").and_then(|x| x.as_str()).unwrap_or("");
        let id1 = mermaid_node_id(from);
        let id2 = mermaid_node_id(to);
        let via_l = mermaid_escape_label(via).replace('|', " ");
        call_graph_lines.push(format!(
            r#"  {}["{}"] -->|{}| {}["{}"]"#,
            id1,
            mermaid_escape_label(from),
            via_l,
            id2,
            mermaid_escape_label(to)
        ));
    }
    let cross_file_call_graph_mermaid = if call_graph_lines.len() > 1 {
        call_graph_lines.join("\n")
    } else {
        "flowchart TB\n  empty[No unambiguous cross-file call edges (heuristic; not AST)]"
            .into()
    };

    let mut class_lines = vec!["classDiagram".to_string()];
    let mut type_nodes: Vec<String> = Vec::new();
    for s in &symbols {
        if let Some(arr) = s.get("symbols").and_then(|x| x.as_array()) {
            for v in arr {
                if let Some(sym) = v.as_str() {
                    if sym.chars().next().map(|c| c.is_uppercase()).unwrap_or(false)
                        && sym.len() < 64
                    {
                        type_nodes.push(sym.to_string());
                    }
                }
            }
        }
    }
    type_nodes.sort();
    type_nodes.dedup();
    for t in type_nodes.iter().take(24) {
        let safe: String = t
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_')
            .collect();
        if !safe.is_empty() {
            class_lines.push(format!("  class {safe}"));
        }
    }
    let class_diagram_mermaid = if class_lines.len() > 1 {
        class_lines.join("\n")
    } else {
        "classDiagram\n  note \"No exported types detected by heuristics\"".into()
    };

    let mut appendix = String::new();
    appendix.push_str("=== Target codebase outline (heuristic scan; not a full AST) ===\n");
    appendix.push_str(&format!("Total source files indexed: {total}\n"));
    appendix.push_str("Top extensions:\n");
    for (e, n) in ext_vec.iter().take(14) {
        appendix.push_str(&format!("- {e}: {n}\n"));
    }
    appendix.push_str("Top first-level segments:\n");
    for (d, n) in top_vec.iter().take(12) {
        appendix.push_str(&format!("- {d}/: {n}\n"));
    }
    appendix.push_str(&format!(
        "Relative import edges (JS/TS, resolved): {}\n",
        import_edges.len()
    ));
    appendix.push_str(&format!(
        "Cross-file call edges (regex; unique symbol → single definition): {}\n",
        call_edges.len()
    ));
    if !detected_projects.is_empty() {
        appendix.push_str("Detected project kinds (marker files):\n");
        for p in detected_projects.iter().take(24) {
            if let (Some(k), Some(arr)) = (
                p.get("kind").and_then(|x| x.as_str()),
                p.get("markers").and_then(|x| x.as_array()),
            ) {
                let ms: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).collect();
                appendix.push_str(&format!("- {}: {}\n", k, ms.join(", ")));
            }
        }
    }
    appendix.push_str("Sample symbols (functions/types) by file:\n");
    for s in symbols.iter().take(18) {
        if let (Some(p), Some(arr)) = (
            s.get("path").and_then(|x| x.as_str()),
            s.get("symbols").and_then(|x| x.as_array()),
        ) {
            let joined: Vec<&str> = arr.iter().filter_map(|v| v.as_str()).take(12).collect();
            if !joined.is_empty() {
                appendix.push_str(&format!("- {}: {}\n", p, joined.join(", ")));
            }
        }
    }
    appendix.truncate(12_000);

    let files = rels_sorted
        .iter()
        .map(|rel| {
            let ext = outline_file_extension(rel);
            let top = rel
                .find('/')
                .map(|i| rel[..i].to_string())
                .unwrap_or_else(|| ".".to_string());
            serde_json::json!({
                "path": rel,
                "ext": ext,
                "top_directory": top,
                "depth": path_depth(rel),
                "line_count": line_count_by_path.get(rel).copied().unwrap_or(0),
                "symbol_count": symbol_count_by_path.get(rel).copied().unwrap_or(0),
            })
        })
        .collect::<Vec<_>>();

    Ok(serde_json::json!({
        "total_files": total,
        "by_extension": ext_vec.iter().map(|(e,n)| serde_json::json!({"ext": e, "count": n})).collect::<Vec<_>>(),
        "top_directories": top_vec.iter().map(|(d,n)| serde_json::json!({"name": d, "count": n})).collect::<Vec<_>>(),
        "files": files,
        "detected_projects": detected_projects,
        "import_edges": import_edges,
        "import_graph_mermaid": import_graph_mermaid,
        "cross_file_call_edges": call_edges,
        "cross_file_call_graph_mermaid": cross_file_call_graph_mermaid,
        "symbols_by_file": symbols,
        "symbol_spans_by_file": symbol_spans_by_file,
        "class_diagram_mermaid": class_diagram_mermaid,
        "prompt_appendix": appendix,
    }))
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
        "codebase-outline" => {
            let root = v
                .get("root")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing root".to_string())?;
            codebase_outline(root)?
        }
        "risk-signals" => {
            let changes: Vec<FileChange> = serde_json::from_value(
                v.get("changes")
                    .cloned()
                    .ok_or_else(|| "Missing changes".to_string())?,
            )
            .map_err(|e| format!("Invalid changes: {e}"))?;
            let left_root = v
                .get("leftRoot")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing leftRoot".to_string())?;
            let right_root = v
                .get("rightRoot")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing rightRoot".to_string())?;
            serde_json::to_value(risk_signals(left_root, right_root, &changes)?)
                .map_err(|e| e.to_string())?
        }
        "filter-changes-gitignore" => {
            let changes: Vec<FileChange> = serde_json::from_value(
                v.get("changes")
                    .cloned()
                    .ok_or_else(|| "Missing changes".to_string())?,
            )
            .map_err(|e| format!("Invalid changes: {e}"))?;
            let left_root = v
                .get("leftRoot")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing leftRoot".to_string())?;
            let right_root = v
                .get("rightRoot")
                .and_then(|x| x.as_str())
                .ok_or_else(|| "Missing rightRoot".to_string())?;
            let left_pb = PathBuf::from(left_root.trim());
            let right_pb = PathBuf::from(right_root.trim());
            let input_changes = changes.len();
            let (filtered_gi, skipped_gitignore) = filter_changes_for_prefetch_gitignore(
                &changes,
                left_pb.as_path(),
                right_pb.as_path(),
            );
            let (filtered, skipped_novadiff_docs) =
                filter_out_novadiff_docs_changes(&filtered_gi);
            let eligible_changes = filtered.len();
            serde_json::json!({
                "changes": filtered,
                "skipped_gitignore": skipped_gitignore,
                "skipped_novadiff_docs": skipped_novadiff_docs,
                "input_changes": input_changes,
                "eligible_changes": eligible_changes,
            })
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

    fn payload_from_new_text(new_text: &str) -> FileDiffPayload {
        let mut payload = line_diff_to_rows("", new_text);
        payload.left_symbols = Vec::new();
        payload.right_symbols = Vec::new();
        payload.summary_evidence = empty_summary_evidence();
        payload
    }

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
        assert_eq!(out.skipped_novadiff_docs, 0);
        assert_eq!(out.skipped_non_text, 0);
    }

    #[test]
    fn prefetch_skips_novadiff_docs_reserved_paths() {
        let changes = vec![
            FileChange {
                path: "novadiff-docs/README.md".into(),
                kind: ChangeKind::Added,
            },
            FileChange {
                path: "src/main.rs".into(),
                kind: ChangeKind::Modified,
            },
        ];
        let out = prefetch_summary_queue(&changes, 50, None);
        assert_eq!(out.input_changes, 2);
        assert_eq!(out.skipped_gitignore, 0);
        assert_eq!(out.skipped_novadiff_docs, 1);
        assert_eq!(out.skipped_non_text, 0);
        assert_eq!(out.eligible_changes, 1);
        assert_eq!(out.queue.len(), 1);
        assert_eq!(out.queue[0].path, "src/main.rs");
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
        assert_eq!(out.skipped_novadiff_docs, 0);
        assert_eq!(out.skipped_non_text, 0);
        assert_eq!(out.eligible_changes, 1);
        assert_eq!(out.queue.len(), 1);
        assert_eq!(out.queue[0].path, "keep.rs");
        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn prefetch_skips_binary_when_roots_sent() {
        let tmp = std::env::temp_dir().join(format!(
            "novadiff-binary-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let left = tmp.join("left");
        let right = tmp.join("right");
        std::fs::create_dir_all(&left).unwrap();
        std::fs::create_dir_all(&right).unwrap();
        std::fs::write(left.join("keep.rs"), "fn old_keep() {}\n").unwrap();
        std::fs::write(right.join("keep.rs"), "fn new_keep() {}\n").unwrap();
        std::fs::write(right.join("logo.bin"), [0_u8, 159, 146, 150]).unwrap();
        let changes = vec![
            FileChange {
                path: "logo.bin".into(),
                kind: ChangeKind::Added,
            },
            FileChange {
                path: "keep.rs".into(),
                kind: ChangeKind::Modified,
            },
        ];
        let out = prefetch_summary_queue(&changes, 50, Some((left.as_path(), right.as_path())));
        assert_eq!(out.input_changes, 2);
        assert_eq!(out.skipped_gitignore, 0);
        assert_eq!(out.skipped_novadiff_docs, 0);
        assert_eq!(out.skipped_non_text, 1);
        assert_eq!(out.eligible_changes, 1);
        assert_eq!(out.queue.len(), 1);
        assert_eq!(out.queue[0].path, "keep.rs");
        let _ = std::fs::remove_dir_all(&tmp);
    }

    #[test]
    fn detects_rust_project_marker() {
        let mut h = std::collections::HashSet::new();
        h.insert("Cargo.toml".into());
        h.insert("src/lib.rs".into());
        let v = detect_detected_projects(&h);
        assert!(v.iter().any(|x| {
            x.get("kind").and_then(|k| k.as_str()) == Some("rust")
        }));
    }

    #[test]
    fn outline_extract_def_spans_infers_line_ranges() {
        let re = OutlineDefRegexSet::new().expect("regex set");
        let text = r#"export function alpha() {
  return 1;
}

export function beta() {
  return alpha();
}
"#;
        let spans = outline_extract_def_spans("src/example.ts", text, &re);
        assert_eq!(spans.len(), 2);
        assert_eq!(spans[0].name, "alpha");
        assert_eq!(spans[0].kind, "function");
        assert_eq!(spans[0].start_line, 1);
        assert_eq!(spans[0].end_line, 4);
        assert_eq!(spans[1].name, "beta");
        assert_eq!(spans[1].start_line, 5);
        assert!(spans[1].end_line >= spans[1].start_line);
    }

    #[test]
    fn detects_js_memory_cleanup_gap() {
        let payload = payload_from_new_text(
            "export function mount(){\n  const id = setInterval(tick, 1000);\n  window.addEventListener('resize', onResize);\n}\n",
        );
        let lines = js_added_memory_leak_lines(&payload);
        assert!(!lines.is_empty());
        assert!(lines.iter().any(|line| line.contains("interval allocation")));
    }

    #[test]
    fn detects_incomplete_impl_stub() {
        let payload = payload_from_new_text(
            "export function runTask(){\n  throw new Error(\"TODO: implement\");\n}\n",
        );
        let lines = added_incomplete_impl_lines(&payload);
        assert!(!lines.is_empty());
    }

    #[test]
    fn rel_path_normalizes() {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let full = root.join("src").join("main.rs");
        assert_eq!(rel_path(&root, &full).as_deref(), Some("src/main.rs"));
    }
}
