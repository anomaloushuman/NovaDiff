import { describe, expect, it } from "vitest";
import {
  computeCodeMapLoadSnapshot,
  isCodeMapExperienceReady,
} from "../src/app/codeMapLoadProgress";

describe("codeMapLoadProgress", () => {
  it("stays on graph phase until graph is ready", () => {
    const snap = computeCodeMapLoadSnapshot({
      graphBuilding: true,
      graphProgress: { message: "Scanning files", phase: "scan" },
      graphReady: false,
      explorerMounted: false,
      cityLoading: false,
      cityReady: false,
      spawnTarget: 24,
    });
    expect(snap.phase).toBe("Knowledge graph");
    expect(snap.percent).toBeLessThan(55);
  });

  it("reports ready only when graph explorer and city are done", () => {
    expect(
      isCodeMapExperienceReady({
        graphReady: true,
        explorerMounted: true,
        cityReady: true,
        graphBuilding: false,
      }),
    ).toBe(true);
    expect(
      isCodeMapExperienceReady({
        graphReady: true,
        explorerMounted: false,
        cityReady: true,
        graphBuilding: false,
      }),
    ).toBe(false);
  });
});
