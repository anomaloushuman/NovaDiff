/** Must match `NOVADIFF_DOCS_DIR` in `cli/src/main.rs`. */
export const NOVADIFF_DOCS_REL = "novadiff-docs";

export function isNovadiffDocsReservedPath(rel: string | null | undefined): boolean {
  if (rel == null || rel === "") {
    return false;
  }
  const s = rel.replace(/\\/g, "/");
  return s === NOVADIFF_DOCS_REL || s.startsWith(`${NOVADIFF_DOCS_REL}/`);
}
