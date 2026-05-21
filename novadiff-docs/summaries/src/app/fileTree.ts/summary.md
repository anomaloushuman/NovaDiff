### Overview  
A new module `src/app/fileTree.ts` is added. It defines the `FileTreeNode` interface (lines 1‑6) and provides functions to build, sort, filter, and collect folder paths from a list of relative paths.

### Key changes  
- **`FileTreeNode` interface** (lines 1‑6): `name`, `path`, `type` (`"file"` | `"dir"`), and `children`.  
- **`insertPath`** (lines 8‑31): builds a tree by splitting a path on `/` and creating nodes on demand.  
- **`sortNodes` / `sortTree`** (lines 32‑47): sort children so directories precede files and names are alphabetically ordered.  
- **`buildFileTree`** (lines 48‑54): constructs a sorted tree from an array of paths.  
- **`cloneFiltered`** (lines 56‑67): recursively clones nodes whose `path` contains a query string (case‑insensitive).  
- **`filterFileTree`** (lines 69‑75): public API that returns the filtered tree or an empty root when no matches.  
- **`collectFolderPaths`** (lines 78‑90): returns an array of all directory paths in the tree.

### Impact  
- **Public API**: `buildFileTree`, `filterFileTree`, and `collectFolderPaths` are exported; consumers can build or query a file tree.  
- **Maintainability**: Centralizes tree logic, reducing duplication across the codebase.  
- **Correctness**: Path handling uses `split("/")` and `filter(Boolean)`, ignoring leading/trailing slashes; input paths should conform to this expectation.  
- **Compatibility**: No existing modules are modified, so backward compatibility is preserved.

### Risks & follow‑ups  
- **Integration**: Ensure imports reference `src/app/fileTree.ts`.  
- **Testing**: Add unit tests for edge cases (empty paths, duplicates, case sensitivity).  
- **Linting & Build**: Run the repository’s lint, test, and production build scripts to confirm no TypeScript errors.  
- **Performance**: `cloneFiltered` performs a recursive clone; unknown from the available diff/scan evidence whether this is a bottleneck.
