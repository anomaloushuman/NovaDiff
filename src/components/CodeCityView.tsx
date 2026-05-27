import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CityEdgeOverlay } from "../app/graphCityBridge";
import {
  type CodeCityLayoutResult,
  type CodeCityRenderableBuilding,
  type CodeCityRenderableDistrict,
} from "../app/codeCityLayout";
import { createCityRenderer } from "../app/codeCityRenderer";
import {
  cityPixelRatio,
  shouldOmitWindowDetail,
} from "../app/graphicsPerformance";

const FILE_GROUP_COLOR = 0x3dd6c6;
const FILE_GROUP_EMISSIVE = 0x2a9d8f;
const SELECTED_EMISSIVE = 0x7ee7ff;

type BuildingVisualState = "idle" | "dimmed" | "highlighted" | "fileGroup" | "selected";

interface ExitingBuilding {
  group: THREE.Group;
  t: number;
  changeState: CodeCityRenderableBuilding["changeState"];
}

interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  districtsGroup: THREE.Group;
  buildingsRoot: THREE.Group;
  buildingGroups: Map<string, THREE.Group>;
  exitingBuildings: Map<string, ExitingBuilding>;
  enteringProgress: Map<string, number>;
  edgeGroup: THREE.Group;
  districtMaterial: THREE.MeshStandardMaterial;
  centerX: number;
  centerZ: number;
  maxSpan: number;
  orbitTarget: THREE.Vector3;
  orbitGoalTarget: THREE.Vector3;
  orbitDistance: number;
  orbitGoalDistance: number;
  frame: number;
  omitWindows: boolean;
  cameraDirty: boolean;
  /** While > 0, orbit all filtered buildings (ignore selection). */
  filterReframeFrames: number;
  disposeRenderer: () => void;
  renderBackend: "webgpu" | "webgl";
  raycaster: THREE.Raycaster;
  pickTargets: THREE.Mesh[];
}

const BUILD_ENTER_SPEED = 0.14;
const BUILD_EXIT_SPEED = 0.2;
const FILTER_REFRAME_FRAMES = 120;
const ORBIT_LERP_ALL = 0.11;
const ORBIT_LERP_CLUSTER = 0.09;
const ORBIT_CAMERA_LERP_ALL = 0.055;
const ORBIT_CAMERA_LERP_CLUSTER = 0.042;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function transitionEmissiveForChange(
  changeState: CodeCityRenderableBuilding["changeState"],
  phase: "enter" | "exit",
): number {
  const base =
    changeState === "added"
      ? 0x3cf2aa
      : changeState === "removed"
        ? 0xff5f73
        : changeState === "modified"
          ? 0x7ee7ff
          : 0x1e2f40;
  return phase === "exit" ? base : base;
}

function applyTransitionEmissive(group: THREE.Group, emissive: number, intensity: number) {
  const mesh = group.userData.pickMesh as THREE.Mesh | undefined;
  if (!mesh?.material || !(mesh.material instanceof THREE.MeshStandardMaterial)) {
    return;
  }
  mesh.material.emissive.setHex(emissive);
  mesh.material.emissiveIntensity = intensity;
}

interface SelectionState {
  selectedBuildingId: string | null;
  fileMateIds: Set<string>;
  highlightIds: Set<string>;
  focusMode: boolean;
}

function attachSelectable(object: THREE.Object3D, building: CodeCityRenderableBuilding) {
  object.userData.building = building;
  for (const child of object.children) {
    attachSelectable(child, building);
  }
}

function buildingCenter(building: CodeCityRenderableBuilding): THREE.Vector3 {
  return new THREE.Vector3(building.x, building.height / 2, building.z);
}

function computeLayoutBounds(layout: CodeCityLayoutResult) {
  const bounds = layout.buildings.length
    ? {
        minX: Math.min(...layout.buildings.map((b) => b.x - b.width / 2)),
        maxX: Math.max(...layout.buildings.map((b) => b.x + b.width / 2)),
        minZ: Math.min(...layout.buildings.map((b) => b.z - b.depth / 2)),
        maxZ: Math.max(...layout.buildings.map((b) => b.z + b.depth / 2)),
      }
    : layout.districts.length
      ? {
          minX: Math.min(...layout.districts.map((d) => d.x - d.width / 2)),
          maxX: Math.max(...layout.districts.map((d) => d.x + d.width / 2)),
          minZ: Math.min(...layout.districts.map((d) => d.z - d.depth / 2)),
          maxZ: Math.max(...layout.districts.map((d) => d.z + d.depth / 2)),
        }
      : { minX: 0, maxX: 48, minZ: 0, maxZ: 48 };
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const spanX = bounds.maxX - bounds.minX;
  const spanZ = bounds.maxZ - bounds.minZ;
  const maxSpan = Math.max(42, spanX, spanZ);
  return { centerX, centerZ, maxSpan };
}

const _fitBox = new THREE.Box3();
const _fitSize = new THREE.Vector3();

/** Frame a set of buildings in view (filtered city or file cluster). */
function framingForBuildings(
  buildings: CodeCityRenderableBuilding[],
  camera: THREE.PerspectiveCamera,
  fallbackCenter: THREE.Vector3,
  padding = 1.42,
): { target: THREE.Vector3; distance: number } {
  if (buildings.length === 0) {
    return { target: fallbackCenter.clone(), distance: 72 };
  }

  _fitBox.makeEmpty();
  for (const b of buildings) {
    _fitBox.expandByPoint(new THREE.Vector3(b.x - b.width / 2, 0, b.z - b.depth / 2));
    _fitBox.expandByPoint(new THREE.Vector3(b.x + b.width / 2, b.height, b.z + b.depth / 2));
  }

  const target = _fitBox.getCenter(new THREE.Vector3());
  _fitBox.getSize(_fitSize);

  if (_fitSize.lengthSq() < 1e-6) {
    return { target, distance: 48 };
  }

  const vFovRad = (camera.fov * Math.PI) / 180;
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * camera.aspect);
  const distY = (_fitSize.y / 2) / Math.tan(vFovRad / 2);
  const distX = (_fitSize.x / 2) / Math.tan(hFovRad / 2);
  const distZ = (_fitSize.z / 2) / Math.tan(hFovRad / 2);
  const distance = Math.max(distX, distY, distZ) * padding;

  target.y = Math.max(_fitSize.y * 0.28, 4);

  const minDist = buildings.length === 1 ? 22 : 28;
  const maxDist = buildings.length === 1 ? 120 : 380;

  return {
    target,
    distance: Math.max(minDist, Math.min(distance, maxDist)),
  };
}

function orbitFocusForBuildings(
  buildings: CodeCityRenderableBuilding[],
  selectedBuildingId: string | null,
  cityCenter: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
): { target: THREE.Vector3; distance: number; mode: "all" | "file-cluster" } {
  if (!selectedBuildingId || buildings.length === 0) {
    const focus = framingForBuildings(buildings, camera, cityCenter);
    return { ...focus, mode: "all" };
  }
  const selected = buildings.find((b) => b.id === selectedBuildingId);
  if (!selected) {
    const focus = framingForBuildings(buildings, camera, cityCenter);
    return { ...focus, mode: "all" };
  }
  const mates = buildings.filter((b) => b.path === selected.path);
  const cluster = mates.length > 0 ? mates : [selected];
  const focus = framingForBuildings(cluster, camera, cityCenter, 1.36);
  return { ...focus, mode: "file-cluster" };
}

function visualStateForBuilding(
  buildingId: string,
  building: CodeCityRenderableBuilding,
  state: SelectionState,
): BuildingVisualState {
  if (state.selectedBuildingId === buildingId) {
    return "selected";
  }
  if (state.fileMateIds.has(buildingId)) {
    return "fileGroup";
  }
  if (state.highlightIds.has(buildingId)) {
    return "highlighted";
  }
  if (state.focusMode && (state.highlightIds.size > 0 || state.selectedBuildingId)) {
    return "dimmed";
  }
  void building;
  return "idle";
}

function applyBuildingVisual(
  group: THREE.Group,
  building: CodeCityRenderableBuilding,
  visual: BuildingVisualState,
) {
  const mesh = group.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
  const edge = group.children.find((c) => c instanceof THREE.LineSegments) as
    | THREE.LineSegments
    | undefined;
  if (mesh?.material instanceof THREE.MeshStandardMaterial) {
    const baseColor = new THREE.Color(building.color);
    const baseEmissive = new THREE.Color(building.emissive);
    if (visual === "selected") {
      mesh.material.color.copy(baseColor);
      mesh.material.emissive.setHex(SELECTED_EMISSIVE);
      mesh.material.emissiveIntensity = 1.15;
      mesh.material.opacity = building.isGhost ? 0.5 : 1;
    } else if (visual === "fileGroup") {
      mesh.material.color.setHex(FILE_GROUP_COLOR);
      mesh.material.emissive.setHex(FILE_GROUP_EMISSIVE);
      mesh.material.emissiveIntensity = 0.95;
      mesh.material.opacity = building.isGhost ? 0.42 : 0.98;
    } else if (visual === "highlighted") {
      mesh.material.color.copy(baseColor);
      mesh.material.emissive.copy(baseEmissive);
      mesh.material.emissiveIntensity = 0.9;
      mesh.material.opacity = building.isGhost ? 0.34 : 0.96;
    } else if (visual === "dimmed") {
      mesh.material.color.copy(baseColor);
      mesh.material.emissive.copy(baseEmissive);
      mesh.material.emissiveIntensity = building.isGhost ? 0.15 : 0.22;
      mesh.material.opacity = 0.14;
    } else {
      mesh.material.color.copy(baseColor);
      mesh.material.emissive.copy(baseEmissive);
      mesh.material.emissiveIntensity = building.isGhost ? 0.25 : 0.55;
      mesh.material.opacity = building.isGhost ? 0.34 : 0.96;
    }
  }
  if (edge?.material instanceof THREE.LineBasicMaterial) {
    if (visual === "selected") {
      edge.material.color.setHex(0xf7fbff);
      edge.material.opacity = 0.95;
    } else if (visual === "fileGroup") {
      edge.material.color.setHex(FILE_GROUP_COLOR);
      edge.material.opacity = 0.72;
    } else if (visual === "highlighted") {
      edge.material.color.setHex(0x7ee7ff);
      edge.material.opacity = 0.55;
    } else if (visual === "dimmed") {
      edge.material.color.setHex(0x5a7088);
      edge.material.opacity = 0.08;
    } else {
      edge.material.color.setHex(building.isGhost ? 0x7c90a6 : 0xc2e7ff);
      edge.material.opacity = building.isGhost ? 0.25 : 0.16;
    }
  }
  const targetScale =
    visual === "selected" ? 1.05 : visual === "fileGroup" ? 1.02 : 1;
  group.scale.setScalar(targetScale);
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        for (const mat of child.material) {
          mat.dispose();
        }
      } else {
        child.material.dispose();
      }
    }
    if (child instanceof THREE.LineSegments || child instanceof THREE.Line) {
      child.geometry.dispose();
      if (child.material instanceof THREE.Material) {
        child.material.dispose();
      }
    }
  });
}

function createBuildingGroup(
  building: CodeCityRenderableBuilding,
  omitWindows: boolean,
): THREE.Group {
  const buildingGroup = new THREE.Group();
  buildingGroup.userData.buildingId = building.id;
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(building.color),
    emissive: new THREE.Color(building.emissive),
    emissiveIntensity: building.isGhost ? 0.25 : 0.55,
    transparent: building.isGhost,
    opacity: building.isGhost ? 0.34 : 0.96,
    metalness: 0.12,
    roughness: 0.46,
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(building.width, building.height, building.depth),
    material,
  );
  mesh.position.set(0, building.height / 2, 0);
  mesh.frustumCulled = true;
  mesh.userData.building = building;
  mesh.userData.isPickTarget = true;
  buildingGroup.add(mesh);
  buildingGroup.userData.pickMesh = mesh;

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(building.width, building.height, building.depth)),
    new THREE.LineBasicMaterial({
      color: building.isGhost ? 0x7c90a6 : 0xc2e7ff,
      transparent: true,
      opacity: building.isGhost ? 0.25 : 0.16,
    }),
  );
  edge.position.copy(mesh.position);
  buildingGroup.add(edge);

  if (omitWindows) {
    buildingGroup.position.set(building.x, 0, building.z);
    attachSelectable(buildingGroup, building);
    return buildingGroup;
  }

  const rows = Math.max(2, Math.min(6, Math.floor(building.height / 4)));
  const cols = building.kind === "class" || building.kind === "interface" ? 3 : 2;
  const windowColor = new THREE.Color(building.emissive);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: windowColor,
    emissive: windowColor,
    emissiveIntensity: building.isGhost ? 0.4 : 1.6,
    transparent: true,
    opacity: building.isGhost ? 0.3 : 0.95,
  });
  const insetX = building.width / 2 + 0.05;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const y = 1.2 + row * Math.max(1.2, building.height / (rows + 1));
      const z =
        -building.depth / 2 + 0.55 + col * ((building.depth - 1.1) / Math.max(1, cols - 1));
      const front = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.38), windowMaterial);
      front.position.set(insetX, y, z);
      front.frustumCulled = true;
      front.userData.isWindow = true;
      const back = front.clone();
      back.position.x = -insetX;
      back.userData.isWindow = true;
      buildingGroup.add(front);
      buildingGroup.add(back);
    }
  }

  buildingGroup.position.set(building.x, 0, building.z);
  attachSelectable(buildingGroup, building);
  return buildingGroup;
}

function syncDistrictMeshes(
  ctx: SceneContext,
  districts: CodeCityRenderableDistrict[],
) {
  const existing = new Map<string, THREE.Mesh>();
  for (const child of ctx.districtsGroup.children) {
    if (child instanceof THREE.Mesh && child.userData.districtName) {
      existing.set(child.userData.districtName as string, child);
    }
  }
  const nextNames = new Set(districts.map((d) => d.name));
  for (const [name, mesh] of existing) {
    if (!nextNames.has(name)) {
      ctx.districtsGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  }
  for (const district of districts) {
    let mesh = existing.get(district.name);
    if (!mesh) {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(district.width + 6, 0.8, district.depth + 6),
        ctx.districtMaterial.clone(),
      );
      mesh.userData.districtName = district.name;
      mesh.frustumCulled = true;
      mesh.raycast = () => {};
      ctx.districtsGroup.add(mesh);
    }
    mesh.position.set(district.x, -0.5, district.z);
    mesh.scale.set(1, 1, 1);
  }
}

function rebuildPickTargets(ctx: SceneContext): void {
  ctx.pickTargets = [];
  for (const group of ctx.buildingGroups.values()) {
    const mesh = group.userData.pickMesh as THREE.Mesh | undefined;
    if (mesh) {
      ctx.pickTargets.push(mesh);
    }
  }
}

function updateBuildingGroupGeometry(
  group: THREE.Group,
  building: CodeCityRenderableBuilding,
) {
  group.position.set(building.x, 0, building.z);
  attachSelectable(group, building);
  const mesh = group.userData.pickMesh as THREE.Mesh | undefined;
  if (mesh) {
    mesh.userData.building = building;
    mesh.position.set(0, building.height / 2, 0);
    mesh.scale.y = 1;
    if (mesh.geometry instanceof THREE.BoxGeometry) {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.BoxGeometry(building.width, building.height, building.depth);
    }
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.setHex(building.color);
      mesh.material.emissive.setHex(building.emissive);
    }
  }
}

function syncBuildingMeshes(
  ctx: SceneContext,
  buildings: CodeCityRenderableBuilding[],
  omitWindows: boolean,
) {
  const nextById = new Map(buildings.map((b) => [b.id, b]));
  const nextIds = new Set(nextById.keys());

  for (const [id, group] of [...ctx.buildingGroups.entries()]) {
    if (nextIds.has(id)) {
      continue;
    }
    const building = group.userData.building as CodeCityRenderableBuilding | undefined;
    ctx.buildingGroups.delete(id);
    ctx.enteringProgress.delete(id);
    ctx.exitingBuildings.set(id, {
      group,
      t: 0,
      changeState: building?.changeState ?? "unchanged",
    });
  }

  for (const [id, exiting] of [...ctx.exitingBuildings.entries()]) {
    if (nextIds.has(id)) {
      ctx.exitingBuildings.delete(id);
      ctx.buildingGroups.set(id, exiting.group);
      ctx.enteringProgress.set(id, 0);
      exiting.group.scale.setScalar(0.05);
      const building = nextById.get(id);
      if (building) {
        updateBuildingGroupGeometry(exiting.group, building);
      }
    }
  }

  for (const building of buildings) {
    let group = ctx.buildingGroups.get(building.id);
    if (!group) {
      group = createBuildingGroup(building, omitWindows);
      group.scale.setScalar(0.05);
      ctx.buildingGroups.set(building.id, group);
      ctx.buildingsRoot.add(group);
      ctx.enteringProgress.set(building.id, 0);
    } else {
      updateBuildingGroupGeometry(group, building);
      if (!ctx.enteringProgress.has(building.id)) {
        group.scale.setScalar(1);
      }
    }
  }

  rebuildPickTargets(ctx);
}

function tickBuildingTransitions(ctx: SceneContext) {
  for (const [id, progress] of [...ctx.enteringProgress.entries()]) {
    const group = ctx.buildingGroups.get(id);
    if (!group) {
      ctx.enteringProgress.delete(id);
      continue;
    }
    const next = Math.min(1, progress + BUILD_ENTER_SPEED);
    const building = group.userData.building as CodeCityRenderableBuilding | undefined;
    const eased = easeOutCubic(next);
    group.scale.setScalar(Math.max(0.05, eased));
    if (building) {
      applyTransitionEmissive(
        group,
        transitionEmissiveForChange(building.changeState, "enter"),
        building.isGhost ? 0.35 : 0.55 + eased * 0.45,
      );
    }
    if (next >= 1) {
      group.scale.setScalar(1);
      ctx.enteringProgress.delete(id);
    } else {
      ctx.enteringProgress.set(id, next);
    }
  }

  for (const [id, exiting] of [...ctx.exitingBuildings.entries()]) {
    const next = Math.min(1, exiting.t + BUILD_EXIT_SPEED);
    const eased = easeOutCubic(next);
    const scale = Math.max(0.02, 1 - eased);
    exiting.group.scale.setScalar(scale);
    applyTransitionEmissive(
      exiting.group,
      transitionEmissiveForChange(exiting.changeState, "exit"),
      0.35 + (1 - eased) * 0.85,
    );
    if (next >= 1) {
      ctx.buildingsRoot.remove(exiting.group);
      disposeObject3D(exiting.group);
      ctx.exitingBuildings.delete(id);
    } else {
      ctx.exitingBuildings.set(id, { ...exiting, t: next });
    }
  }
}

function pickBuildingAt(
  ctx: SceneContext,
  event: PointerEvent,
): CodeCityRenderableBuilding | null {
  const dom = ctx.renderer.domElement;
  const rect = dom.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    return null;
  }
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  ctx.raycaster.setFromCamera(pointer, ctx.camera);
  const hits = ctx.raycaster.intersectObjects(ctx.pickTargets, false);
  const hit = hits[0];
  return (hit?.object.userData?.building as CodeCityRenderableBuilding | undefined) ?? null;
}

export function CodeCityView({
  layout,
  filterReframeKey,
  rootSide,
  compareOverlay,
  blameOverlay,
  selectedBuildingId,
  highlightBuildingIds = [],
  focusBuildingId = null,
  edgeOverlays = [],
  focusMode = false,
  onSelect,
  onEnterBuilding,
  floatChrome = false,
}: {
  layout: CodeCityLayoutResult;
  /** When filters change, orbit to frame all visible buildings (not selection). */
  filterReframeKey?: string;
  rootSide: "baseline" | "target";
  compareOverlay: boolean;
  blameOverlay: boolean;
  selectedBuildingId: string | null;
  highlightBuildingIds?: string[];
  focusBuildingId?: string | null;
  edgeOverlays?: CityEdgeOverlay[];
  focusMode?: boolean;
  onSelect: (building: CodeCityRenderableBuilding | null) => void;
  onEnterBuilding?: (building: CodeCityRenderableBuilding) => void;
  /** Minimal chrome for floating overlay on the knowledge graph. */
  floatChrome?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<SceneContext | null>(null);
  const canvasVisibleRef = useRef(true);
  const prevVisualBuildingIdsRef = useRef<Set<string>>(new Set());
  const [renderBackend, setRenderBackend] = useState<"webgpu" | "webgl" | null>(null);
  const omitWindows = shouldOmitWindowDetail(layout.buildings.length);
  const layoutRef = useRef(layout);
  const onSelectRef = useRef(onSelect);
  const onEnterRef = useRef(onEnterBuilding);
  const selectionRef = useRef<SelectionState>({
    selectedBuildingId: null,
    fileMateIds: new Set(),
    highlightIds: new Set(),
    focusMode: false,
  });

  layoutRef.current = layout;
  onSelectRef.current = onSelect;
  onEnterRef.current = onEnterBuilding;

  const buildingIdsKey = useMemo(
    () => layout.buildings.map((b) => b.id).join("|"),
    [layout.buildings],
  );
  const districtKey = useMemo(
    () => layout.districts.map((d) => `${d.name}:${d.x}:${d.z}`).join("|"),
    [layout.districts],
  );

  const fileMateIds = useMemo(() => {
    const focusId = selectedBuildingId ?? focusBuildingId;
    if (!focusId) {
      return new Set<string>();
    }
    const anchor = layout.buildings.find((b) => b.id === focusId);
    if (!anchor) {
      return new Set<string>();
    }
    return new Set(
      layout.buildings.filter((b) => b.path === anchor.path).map((b) => b.id),
    );
  }, [layout.buildings, selectedBuildingId, focusBuildingId]);

  const highlightSet = useMemo(() => {
    const set = new Set(highlightBuildingIds);
    if (selectedBuildingId) {
      set.add(selectedBuildingId);
    }
    return set;
  }, [highlightBuildingIds, selectedBuildingId]);

  selectionRef.current = {
    selectedBuildingId: selectedBuildingId ?? focusBuildingId,
    fileMateIds,
    highlightIds: highlightSet,
    focusMode,
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let disposed = false;
    let teardown: (() => void) | null = null;

    const canvas = document.createElement("canvas");
    canvas.className = "code-city-canvas-gl";
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    mount.replaceChildren(canvas);

    const width = floatChrome
      ? Math.max(64, mount.clientWidth || 320)
      : Math.max(320, mount.clientWidth || 960);
    const height = floatChrome
      ? Math.max(48, mount.clientHeight || 240)
      : Math.max(420, mount.clientHeight || 560);

    void (async () => {
      const cityRender = await createCityRenderer({
        canvas,
        width,
        height,
        alpha: Boolean(floatChrome),
        antialias: true,
        pixelRatio: cityPixelRatio(layoutRef.current.buildings.length),
        preferWebGpu: !floatChrome,
      });
      if (disposed) {
        cityRender.dispose();
        return;
      }

      const renderer = cityRender.renderer;
      const bounds = computeLayoutBounds(layoutRef.current);
      const cityCenter = new THREE.Vector3(
        bounds.centerX,
        Math.max(6, bounds.maxSpan * 0.06),
        bounds.centerZ,
      );

      const scene = new THREE.Scene();
      if (floatChrome) {
        scene.background = null;
      } else {
        scene.background = new THREE.Color(0x07101a);
        scene.fog = new THREE.Fog(0x07101a, bounds.maxSpan * 1.5, bounds.maxSpan * 4.8);
      }

      const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
      camera.position.set(
        bounds.centerX + bounds.maxSpan * 0.92,
        Math.max(42, bounds.maxSpan * 0.95),
        bounds.centerZ + bounds.maxSpan * 1.06,
      );

      const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.copy(cityCenter);
    controls.minDistance = Math.max(18, bounds.maxSpan * 0.22);
    controls.maxDistance = Math.max(120, bounds.maxSpan * 4);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.42;

    scene.add(new THREE.AmbientLight(0x9fb8d1, 1.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(
      bounds.centerX + bounds.maxSpan,
      bounds.maxSpan * 1.8,
      bounds.centerZ + bounds.maxSpan * 0.6,
    );
    scene.add(dirLight);

    const gridSize = Math.max(120, Math.ceil((bounds.maxSpan * 3) / 20) * 20);
    const gridDivisions = Math.max(24, Math.round(gridSize / 6));
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x173149, 0x102535);
    grid.position.set(bounds.centerX, -0.1, bounds.centerZ);
    scene.add(grid);

    const districtMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d1d2d,
      transparent: true,
      opacity: 0.92,
      metalness: 0.05,
      roughness: 0.92,
    });
    const districtsGroup = new THREE.Group();
    scene.add(districtsGroup);

    const buildingsRoot = new THREE.Group();
    scene.add(buildingsRoot);

    const edgeGroup = new THREE.Group();
    scene.add(edgeGroup);

    const initialFocus = framingForBuildings(
      layoutRef.current.buildings,
      camera,
      cityCenter,
    );
    const orbitTarget = initialFocus.target.clone();
    const orbitGoalTarget = initialFocus.target.clone();
    const orbitDistance = initialFocus.distance;
    const orbitGoalDistance = initialFocus.distance;

    const ctx: SceneContext = {
      scene,
      camera,
      controls,
      renderer,
      districtsGroup,
      buildingsRoot,
      buildingGroups: new Map(),
      exitingBuildings: new Map(),
      enteringProgress: new Map(),
      edgeGroup,
      districtMaterial,
      centerX: bounds.centerX,
      centerZ: bounds.centerZ,
      maxSpan: bounds.maxSpan,
      orbitTarget,
      orbitGoalTarget,
      orbitDistance,
      orbitGoalDistance,
      frame: 0,
      omitWindows,
      cameraDirty: true,
      filterReframeFrames: FILTER_REFRAME_FRAMES,
      disposeRenderer: cityRender.dispose,
      renderBackend: cityRender.backend,
      raycaster: new THREE.Raycaster(),
      pickTargets: [],
    };
    ctx.raycaster.params.Mesh.threshold = 0.35;
    ctxRef.current = ctx;
    setRenderBackend(cityRender.backend);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        canvasVisibleRef.current = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0.02 },
    );
    visibilityObserver.observe(mount);
    const onVisibilityChange = () => {
      canvasVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    syncDistrictMeshes(ctx, layoutRef.current.districts);
    syncBuildingMeshes(ctx, layoutRef.current.buildings, omitWindows);

    const pointerDown = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      pointerDown.x = event.clientX;
      pointerDown.y = event.clientY;
      controls.autoRotate = false;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      controls.autoRotate = true;
      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      if (dx * dx + dy * dy > 64) {
        return;
      }
      const building = pickBuildingAt(ctx, event);
      if (event.detail >= 2) {
        if (building && onEnterRef.current) {
          onEnterRef.current(building);
        }
        return;
      }
      onSelectRef.current(building);
    };

    const dom = renderer.domElement;
    dom.style.touchAction = "none";
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);

    const cityCenterVec = new THREE.Vector3();

    const render = () => {
      ctx.frame = window.requestAnimationFrame(render);
      if (!canvasVisibleRef.current || document.hidden) {
        return;
      }

      const layoutNow = layoutRef.current;
      const selection = selectionRef.current;
      const boundsNow = computeLayoutBounds(layoutNow);

      cityCenterVec.set(
        boundsNow.centerX,
        Math.max(6, boundsNow.maxSpan * 0.06),
        boundsNow.centerZ,
      );

      const reframeFromFilters = ctx.filterReframeFrames > 0;
      if (reframeFromFilters) {
        ctx.filterReframeFrames -= 1;
      }

      const orbitSelectionId =
        reframeFromFilters || !selection.selectedBuildingId
          ? null
          : selection.selectedBuildingId;

      const focus = orbitFocusForBuildings(
        layoutNow.buildings,
        orbitSelectionId,
        cityCenterVec,
        camera,
      );
      ctx.orbitGoalTarget.copy(focus.target);
      ctx.orbitGoalDistance = focus.distance;

      const hasSelection = focus.mode === "file-cluster";
      const distLerp = hasSelection ? ORBIT_LERP_CLUSTER : ORBIT_LERP_ALL;
      const targetLerp = hasSelection ? ORBIT_LERP_CLUSTER + 0.01 : ORBIT_LERP_ALL;
      const cameraLerp = hasSelection ? ORBIT_CAMERA_LERP_CLUSTER : ORBIT_CAMERA_LERP_ALL;

      ctx.orbitDistance += (ctx.orbitGoalDistance - ctx.orbitDistance) * distLerp;
      ctx.orbitTarget.lerp(ctx.orbitGoalTarget, targetLerp);
      controls.target.lerp(ctx.orbitTarget, targetLerp + 0.01);

      controls.autoRotate = true;
      controls.autoRotateSpeed = hasSelection ? 0.55 : 0.38;

      const distFromTarget = camera.position.distanceTo(controls.target);
      const desiredDist = ctx.orbitDistance;
      if (Math.abs(distFromTarget - desiredDist) > 0.5) {
        const dir = camera.position.clone().sub(controls.target);
        if (dir.lengthSq() < 1e-6) {
          dir.set(0.35, 0.55, 0.75).normalize();
        } else {
          dir.normalize();
        }
        const blended = controls.target.clone().add(dir.multiplyScalar(desiredDist));
        camera.position.lerp(blended, cameraLerp);
      }

      controls.minDistance = Math.max(
        12,
        hasSelection ? focus.distance * 0.45 : focus.distance * 0.5,
      );
      controls.maxDistance = Math.max(
        120,
        hasSelection ? focus.distance * 2.4 : focus.distance * 2,
      );

      if (ctx.cameraDirty) {
        ctx.cameraDirty = false;
        ctx.centerX = boundsNow.centerX;
        ctx.centerZ = boundsNow.centerZ;
        ctx.maxSpan = boundsNow.maxSpan;
        if (scene.fog instanceof THREE.Fog) {
          scene.fog.far = boundsNow.maxSpan * 4.8;
          scene.fog.near = boundsNow.maxSpan * 1.5;
        }
      }

      if (!ctx.omitWindows && ctx.frame % 10 === 0) {
        const boundsNow = computeLayoutBounds(layoutNow);
        const lodDistance = boundsNow.maxSpan * 1.35;
        for (const group of ctx.buildingGroups.values()) {
          const dist = camera.position.distanceTo(
            new THREE.Vector3(group.position.x, group.position.y + 4, group.position.z),
          );
          const showDetail = dist < lodDistance;
          for (const child of group.children) {
            if (child.userData?.isWindow) {
              child.visible = showDetail;
            }
          }
        }
      }

      tickBuildingTransitions(ctx);
      controls.update();
      renderer.render(scene, camera);
    };
      render();

      const resizeObserver = new ResizeObserver((entries) => {
        const next = entries[0];
        if (!next) {
          return;
        }
        const nextWidth = Math.max(
          floatChrome ? 64 : 320,
          Math.floor(next.contentRect.width),
        );
        const nextHeight = Math.max(
          floatChrome ? 48 : 420,
          Math.floor(next.contentRect.height),
        );
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(nextWidth, nextHeight);
      });
      resizeObserver.observe(mount);

      teardown = () => {
        visibilityObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        resizeObserver.disconnect();
        window.cancelAnimationFrame(ctx.frame);
        dom.removeEventListener("pointerdown", onPointerDown);
        dom.removeEventListener("pointerup", onPointerUp);
        dom.removeEventListener("pointercancel", onPointerUp);
        for (const group of ctx.buildingGroups.values()) {
          disposeObject3D(group);
        }
        ctx.districtsGroup.clear();
        controls.dispose();
        cityRender.dispose();
        scene.clear();
        ctxRef.current = null;
        setRenderBackend(null);
        mount.replaceChildren();
      };
    })();

    return () => {
      disposed = true;
      setRenderBackend(null);
      teardown?.();
    };
  }, [floatChrome]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const mount = mountRef.current;
    if (!ctx || !mount) {
      return;
    }
    const w = Math.max(floatChrome ? 64 : 320, mount.clientWidth);
    const h = Math.max(floatChrome ? 48 : 420, mount.clientHeight);
    if (w < 8 || h < 8) {
      return;
    }
    ctx.camera.aspect = w / h;
    ctx.camera.updateProjectionMatrix();
    ctx.renderer.setPixelRatio(cityPixelRatio(layout.buildings.length));
    ctx.renderer.setSize(w, h);
    ctx.cameraDirty = true;
  }, [floatChrome, layout.buildings.length]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    syncDistrictMeshes(ctx, layout.districts);
    const bounds = computeLayoutBounds(layout);
    ctx.centerX = bounds.centerX;
    ctx.centerZ = bounds.centerZ;
    ctx.maxSpan = bounds.maxSpan;
    ctx.controls.minDistance = Math.max(14, bounds.maxSpan * 0.18);
    ctx.controls.maxDistance = Math.max(120, bounds.maxSpan * 4);
    ctx.cameraDirty = true;
  }, [districtKey, layout.districts]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    if (ctx.omitWindows !== omitWindows) {
      for (const group of ctx.buildingGroups.values()) {
        ctx.buildingsRoot.remove(group);
        disposeObject3D(group);
      }
      for (const exiting of ctx.exitingBuildings.values()) {
        ctx.buildingsRoot.remove(exiting.group);
        disposeObject3D(exiting.group);
      }
      ctx.buildingGroups.clear();
      ctx.exitingBuildings.clear();
      ctx.enteringProgress.clear();
      ctx.omitWindows = omitWindows;
    }
    syncBuildingMeshes(ctx, layout.buildings, omitWindows);
    const bounds = computeLayoutBounds(layout);
    ctx.centerX = bounds.centerX;
    ctx.centerZ = bounds.centerZ;
    ctx.maxSpan = bounds.maxSpan;
    ctx.cameraDirty = true;
  }, [buildingIdsKey, layout.buildings, omitWindows]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx || !filterReframeKey) {
      return;
    }
    ctx.filterReframeFrames = FILTER_REFRAME_FRAMES;
    ctx.cameraDirty = true;
  }, [filterReframeKey]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    ctx.filterReframeFrames = 0;
    ctx.cameraDirty = true;
  }, [selectedBuildingId, focusBuildingId]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    const buildingById = new Map(layout.buildings.map((b) => [b.id, b]));
    const selection = selectionRef.current;
    const touchIds = new Set<string>([
      ...prevVisualBuildingIdsRef.current,
      ...selection.highlightIds,
      ...selection.fileMateIds,
    ]);
    if (selection.selectedBuildingId) {
      touchIds.add(selection.selectedBuildingId);
    }
    prevVisualBuildingIdsRef.current = touchIds;
    for (const id of touchIds) {
      const group = ctx.buildingGroups.get(id);
      const building = buildingById.get(id);
      if (!group || !building) {
        continue;
      }
      const visual = visualStateForBuilding(id, building, selection);
      applyBuildingVisual(group, building, visual);
    }
    ctx.cameraDirty = true;
  }, [
    buildingIdsKey,
    selectedBuildingId,
    focusBuildingId,
    highlightBuildingIds,
    focusMode,
    fileMateIds,
    layout.buildings,
  ]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    const buildingById = new Map(layout.buildings.map((b) => [b.id, b]));

    while (ctx.edgeGroup.children.length > 0) {
      const child = ctx.edgeGroup.children[0];
      ctx.edgeGroup.remove(child);
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    const positions: number[] = [];
    for (const overlay of edgeOverlays) {
      const src = buildingById.get(overlay.sourceBuildingId);
      const tgt = buildingById.get(overlay.targetBuildingId);
      if (!src || !tgt) {
        continue;
      }
      const a = buildingCenter(src);
      const b = buildingCenter(tgt);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const line = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color: 0x38d9ff,
          transparent: true,
          opacity: 0.65,
        }),
      );
      ctx.edgeGroup.add(line);
    }
  }, [buildingIdsKey, edgeOverlays, layout.buildings]);

  if (layout.buildings.length === 0) {
    return (
      <div className="code-city-empty">
        No buildings match the current filters. Try a different root, subsystem, or
        search query.
      </div>
    );
  }

  return (
    <div className={`code-city-shell${floatChrome ? " code-city-shell--float" : ""}`}>
      <div className="code-city-canvas-wrap">
        {!floatChrome ? (
          <div className="code-city-overlay">
            <div className="code-city-overlay-head">
              <div>
                <div className="code-city-overlay-kicker">
                  {rootSide === "baseline" ? "Baseline city" : "Target city"}
                </div>
                <div className="code-city-overlay-title">
                  {layout.districts.length} district{layout.districts.length === 1 ? "" : "s"} ·{" "}
                  {layout.buildings.length} symbol building
                  {layout.buildings.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="code-city-overlay-badges">
                {renderBackend === "webgpu" ? (
                  <span className="code-city-overlay-badge">WebGPU</span>
                ) : null}
                <span className="code-city-overlay-badge">
                  Compare {compareOverlay ? "on" : "off"}
                </span>
                <span className="code-city-overlay-badge">
                  Blame {blameOverlay ? "on" : "off"}
                </span>
              </div>
            </div>
            <p className="code-city-overlay-hint">
              Drag to orbit, scroll to zoom. Click a symbol; same-file buildings highlight
              together. Double-click to enter the file layer.
            </p>
          </div>
        ) : null}
        <div ref={mountRef} className="code-city-canvas" />
      </div>
      {!floatChrome ? (
        <div className="code-city-footnote">
          {layout.buildings.length} symbol building{layout.buildings.length === 1 ? "" : "s"} ·{" "}
          {layout.districts.length} district{layout.districts.length === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
