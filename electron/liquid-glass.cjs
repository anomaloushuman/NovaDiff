"use strict";

let liquidGlassModule = null;
let liquidGlassLoadAttempted = false;

function loadLiquidGlass() {
  if (liquidGlassLoadAttempted) {
    return liquidGlassModule;
  }
  liquidGlassLoadAttempted = true;
  try {
    // Optional dependency in practice; guarded for platform/runtime availability.
    liquidGlassModule = require("electron-liquid-glass");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[liquid-glass] unavailable: ${message}`);
    liquidGlassModule = null;
  }
  return liquidGlassModule;
}

/**
 * Apply native Liquid Glass to a BrowserWindow on macOS.
 * Safe no-op on unsupported platforms or when the addon cannot load.
 *
 * @param {Electron.BrowserWindow | null | undefined} win
 * @returns {{ enabled: boolean; reason?: string; viewId?: number }}
 */
function applyLiquidGlassToWindow(win) {
  if (process.platform !== "darwin") {
    return { enabled: false, reason: "platform_not_supported" };
  }
  if (!win || win.isDestroyed()) {
    return { enabled: false, reason: "window_unavailable" };
  }
  const liquidGlass = loadLiquidGlass();
  if (!liquidGlass || typeof liquidGlass.addView !== "function") {
    return { enabled: false, reason: "module_unavailable" };
  }

  try {
    const viewId = liquidGlass.addView(win.getNativeWindowHandle(), {
      cornerRadius: 14,
      // Subtle cool tint that works in both dark and light modes.
      tintColor: "#6aa8ff12",
      opaque: false,
    });
    // Recommended in upstream docs for native traffic lights visibility.
    win.setWindowButtonVisibility(true);
    return { enabled: true, viewId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[liquid-glass] apply failed: ${message}`);
    return { enabled: false, reason: "apply_failed" };
  }
}

module.exports = {
  applyLiquidGlassToWindow,
};
