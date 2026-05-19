"use strict";

const fssync = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

function sessionPath(userData) {
  return path.join(userData, "novadiff-session.json");
}

function workspacesRoot(userData) {
  return path.join(userData, "novadiff-workspaces");
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const body = `${JSON.stringify(data, null, 2)}\n`;
  await fsp.writeFile(tmp, body, "utf8");
  await fsp.rename(tmp, filePath);
}

async function loadSession(userData) {
  const data = await readJson(sessionPath(userData), {
    gitUser: null,
    activeWorkspaceId: null,
    workspaces: [],
    localOnlyMode: false,
  });
  const workspaces = Array.isArray(data.workspaces) ? data.workspaces : [];
  for (const w of workspaces) {
    if (!w.liveDevRepoRoot && w.repoRoot) {
      w.liveDevRepoRoot = w.repoRoot;
    }
  }
  return {
    gitUser: data.gitUser ?? null,
    activeWorkspaceId: data.activeWorkspaceId ?? null,
    workspaces,
    localOnlyMode: Boolean(data.localOnlyMode),
  };
}

async function setLocalOnlyMode(userData, enabled) {
  const session = await loadSession(userData);
  session.localOnlyMode = Boolean(enabled);
  if (enabled) {
    session.gitUser = null;
    session.activeWorkspaceId = null;
  }
  await saveSession(userData, session);
  return session;
}

async function saveSession(userData, session) {
  await writeJson(sessionPath(userData), session);
}

async function listWorkspaces(userData) {
  const session = await loadSession(userData);
  return session.workspaces;
}

async function upsertWorkspace(userData, workspace) {
  const session = await loadSession(userData);
  const preservedActiveId = session.activeWorkspaceId;
  const idx = session.workspaces.findIndex((w) => w.id === workspace.id);
  if (idx >= 0) {
    session.workspaces[idx] = workspace;
  } else {
    session.workspaces.push(workspace);
  }
  session.activeWorkspaceId = preservedActiveId ?? workspace.id;
  session.updatedAt = new Date().toISOString();
  await saveSession(userData, session);
  return workspace;
}

async function setActiveWorkspace(userData, workspaceId) {
  const session = await loadSession(userData);
  session.activeWorkspaceId = workspaceId;
  await saveSession(userData, session);
  return session;
}

async function setGitUser(userData, gitUser) {
  const session = await loadSession(userData);
  session.gitUser = gitUser;
  await saveSession(userData, session);
  return session;
}

async function getWorkspace(userData, workspaceId) {
  const session = await loadSession(userData);
  return session.workspaces.find((w) => w.id === workspaceId) ?? null;
}

async function updateWorkspaceUiState(userData, workspaceId, uiState) {
  const session = await loadSession(userData);
  const idx = session.workspaces.findIndex((w) => w.id === workspaceId);
  if (idx < 0) {
    throw new Error("Workspace not found");
  }
  session.workspaces[idx].uiState = {
    ...(session.workspaces[idx].uiState ?? {}),
    ...uiState,
  };
  session.workspaces[idx].updatedAt = new Date().toISOString();
  await saveSession(userData, session);
  await writeJson(
    path.join(session.workspaces[idx].dataDir, "meta.json"),
    session.workspaces[idx],
  );
  return session;
}

async function updateWorkspaceLiveRepo(userData, workspaceId, liveDevRepoRoot) {
  const session = await loadSession(userData);
  const idx = session.workspaces.findIndex((w) => w.id === workspaceId);
  if (idx < 0) {
    throw new Error("Workspace not found");
  }
  const next = path.resolve(String(liveDevRepoRoot ?? "").trim());
  if (!next) {
    throw new Error("Repository path is required");
  }
  session.workspaces[idx].liveDevRepoRoot = next;
  session.workspaces[idx].updatedAt = new Date().toISOString();
  await saveSession(userData, session);
  await writeJson(
    path.join(session.workspaces[idx].dataDir, "meta.json"),
    session.workspaces[idx],
  );
  return session;
}

async function createWorkspace(userData, payload) {
  const id = randomUUID();
  const name = String(payload?.name ?? "Workspace").trim() || "Workspace";
  const repoRoot = path.resolve(String(payload?.repoRoot ?? "").trim());
  if (!repoRoot) {
    throw new Error("Repository path is required");
  }
  const dataDir = path.join(workspacesRoot(userData), id);
  await fsp.mkdir(path.join(dataDir, "snapshots"), { recursive: true });
  await fsp.mkdir(path.join(dataDir, "docs"), { recursive: true });
  const workspace = {
    id,
    name,
    repoRoot,
    githubSlug: payload?.githubSlug ?? null,
    dataDir,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    historyStatus: "idle",
    historyError: null,
    historyProgress: null,
    commits: [],
    liveDevRepoRoot: repoRoot,
  };
  await writeJson(path.join(dataDir, "meta.json"), workspace);
  const session = await loadSession(userData);
  session.workspaces.push(workspace);
  session.activeWorkspaceId = id;
  session.localOnlyMode = false;
  await saveSession(userData, session);
  return { workspace, session };
}

module.exports = {
  loadSession,
  saveSession,
  listWorkspaces,
  upsertWorkspace,
  setActiveWorkspace,
  setGitUser,
  setLocalOnlyMode,
  getWorkspace,
  createWorkspace,
  updateWorkspaceLiveRepo,
  updateWorkspaceUiState,
  workspacesRoot,
};
