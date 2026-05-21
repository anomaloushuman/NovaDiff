### Overview  
A new file `src/app/commitChangeAnalysis.ts` (lines 1–209) introduces browser‑safe utilities for classifying commit changes. It replaces external graph‑core types with local interfaces and removes `node:fs` dependencies.

### Key changes  
- **Interfaces** (`ChangeAnalysis`, `UpdateDecision`) defined at lines 4–19.  
- **`topDirectory`** (lines 21–27) extracts the first path segment or returns `null`.  
- **`detectDirectoryChanges`** (lines 29–49) flags structural changes when new or deleted files add previously unknown top‑level directories.  
- **`summarizeChanges`** (lines 52–63) builds a concise string of new, deleted, and modified file counts.  
- **`classifyUpdate`** (lines 67–129) implements decision logic:  
  - `SKIP` if no structural changes.  
  - `FULL_UPDATE` when structural changes exceed 30 files or 50 % of the graph.  
  - `ARCHITECTURE_UPDATE` if directory changes or >10 structural files.  
  - `PARTIAL_UPDATE` otherwise.  
- **`buildChangeAnalysisFromRows`** (lines 132–152) converts `FileChange` rows into a `ChangeAnalysis`.  
- **`classifyCompareRows`** (lines 155–163) wraps the above for direct use.  
- **`districtBreakdown`** (lines 165–185) aggregates changes by top‑level directory and sorts by count.  
- **`graphSymbolsContext`** (lines 188–209) lists affected functions/classes from a graph, limited to 12 entries.

### Impact  
- New public API: modules can import `classifyCompareRows` or `districtBreakdown` without pulling in Node‑specific code.  
- No existing code is altered; the file is entirely new.  
- `detectDirectoryChanges` runs in O(n) over file lists, suitable for typical commit sizes.  
- Human‑readable summaries (`summarizeChanges`, `graphSymbolsContext`) aid UI or log output.

### Risks & follow‑ups  
- **Threshold correctness**: the >30 and >50 % rules are hard‑coded; verify they match project policy.  
- **Directory detection**: `topDirectory` may mis‑handle paths with leading slashes or empty segments.  
- **Graph node filtering**: `graphSymbolsContext` may miss symbols when `changedPaths` contains nested files.  
- **Test coverage**: add unit tests for all decision branches and for `districtBreakdown` aggregation to guard against regressions.
