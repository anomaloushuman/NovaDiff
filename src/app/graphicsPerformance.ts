/** Single quality profile for docked + expanded code city (no remount on expand). */

/** Omit decorative window meshes above this count (box + edges stay). */
export const CITY_OMIT_WINDOWS_BUILDINGS = 900;

export function cityPixelRatio(buildingCount: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  if (buildingCount >= 2000) {
    return Math.min(1.5, dpr);
  }
  return Math.min(2, dpr);
}

export function shouldOmitWindowDetail(buildingCount: number): boolean {
  return buildingCount >= CITY_OMIT_WINDOWS_BUILDINGS;
}
