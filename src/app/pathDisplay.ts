/** User-facing path label — never expose full filesystem paths outside onboarding. */
export function pathDisplayLabel(absPath: string): string {
  const trimmed = absPath.trim();
  if (!trimmed) {
    return "";
  }
  const parts = trimmed.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 0) {
    return trimmed;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}
