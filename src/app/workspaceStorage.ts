import type { GitUserProfile, NovaWorkspace, WorkspaceSessionState } from "./workspaceTypes";

const USER_KEY = "novadiff_git_user_v1";
const ACTIVE_WS_KEY = "novadiff_active_workspace_v1";
const LOCAL_ONLY_KEY = "novadiff_local_only_v1";
const PRODUCT_TOUR_KEY = "novadiff_product_tour_v1";

export function loadProductTourCompleted(): boolean {
  try {
    return localStorage.getItem(PRODUCT_TOUR_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveProductTourCompleted(): void {
  try {
    localStorage.setItem(PRODUCT_TOUR_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function loadCachedGitUser(): GitUserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as GitUserProfile;
  } catch {
    return null;
  }
}

export function saveCachedGitUser(user: GitUserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCachedGitUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function loadCachedActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WS_KEY);
  } catch {
    return null;
  }
}

export function saveCachedActiveWorkspaceId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_WS_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_WS_KEY);
  }
}

export type OnboardingGate = "boot" | "welcome" | "hub" | "app";

export function loadCachedLocalOnly(): boolean {
  try {
    return localStorage.getItem(LOCAL_ONLY_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveCachedLocalOnly(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(LOCAL_ONLY_KEY, "1");
    } else {
      localStorage.removeItem(LOCAL_ONLY_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function resolveOnboardingGate(
  opts: {
    skipBoot: boolean;
    localOnlyMode: boolean;
    hasUser: boolean;
    hasActiveWorkspace: boolean;
    /** Set true after user confirms identity on this launch (welcome screen). */
    launchAuthConfirmed: boolean;
    /** Set true after user picks or continues a workspace on this launch. */
    launchWorkspaceConfirmed: boolean;
  },
): OnboardingGate {
  if (!opts.skipBoot) {
    return "boot";
  }
  if (opts.localOnlyMode) {
    if (!opts.launchWorkspaceConfirmed) {
      return "welcome";
    }
    return "app";
  }
  if (!opts.launchAuthConfirmed) {
    return "welcome";
  }
  if (!opts.launchWorkspaceConfirmed) {
    return "hub";
  }
  return "app";
}

export function mergeSession(
  partial: Partial<WorkspaceSessionState>,
  current: WorkspaceSessionState,
): WorkspaceSessionState {
  return {
    gitUser: partial.gitUser !== undefined ? partial.gitUser : current.gitUser,
    activeWorkspaceId:
      partial.activeWorkspaceId !== undefined
        ? partial.activeWorkspaceId
        : current.activeWorkspaceId,
    workspaces: partial.workspaces !== undefined ? partial.workspaces : current.workspaces,
    localOnlyMode:
      partial.localOnlyMode !== undefined ? partial.localOnlyMode : current.localOnlyMode,
  };
}

export function findWorkspace(
  workspaces: NovaWorkspace[],
  id: string | null | undefined,
): NovaWorkspace | null {
  if (!id) {
    return null;
  }
  return workspaces.find((w) => w.id === id) ?? null;
}
