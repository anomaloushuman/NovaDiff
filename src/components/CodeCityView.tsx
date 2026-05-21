import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CityEdgeOverlay } from "../app/graphCityBridge";
import {
  type CodeCityLayoutResult,
  type CodeCityRenderableBuilding,
  type CodeCityRenderableDistrict,
} from "../app/codeCityLayout";

const FILE_GROUP_COLOR = 0x3dd6c6;
const FILE_GROUP_EMISSIVE = 0x2a9d8f;
const SELECTED_EMISSIVE = 0x7ee7ff;

type BuildingVisualState = "idle" | "dimmed" | "highlighted" | "fileGroup" | "selected";

interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  districtsGroup: THREE.Group;
  buildingsRoot: THREE.Group;
  buildingGroups: Map<string, THREE.Group>;
  edgeGroup: THREE.Group;
  districtMaterial: THREE.MeshStandardMaterial;
  centerX: number;
  centerZ: number;
  maxSpan: number;
  orbitTarget: THREE.Vector3;
  orbitDistance: number;
  frame: number;
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
  const districtBounds = layout.districts.length
    ? {
        minX: Math.min(...layout.districts.map((d) => d.x - d.width / 2)),
        maxX: Math.max(...layout.districts.map((d) => d.x + d.width / 2)),
        minZ: Math.min(...layout.districts.map((d) => d.z - d.depth / 2)),
        maxZ: Math.max(...layout.districts.map((d) => d.z + d.depth / 2)),
      }
    : layout.buildings.length
      ? {
          minX: Math.min(...layout.buildings.map((b) => b.x - b.width / 2)),
          maxX: Math.max(...layout.buildings.map((b) => b.x + b.width / 2)),
          minZ: Math.min(...layout.buildings.map((b) => b.z - b.depth / 2)),
          maxZ: Math.max(...layout.buildings.map((b) => b.z + b.depth / 2)),
        }
      : { minX: 0, maxX: 48, minZ: 0, maxZ: 48 };
  const centerX = (districtBounds.minX + districtBounds.maxX) / 2;
  const centerZ = (districtBounds.minZ + districtBounds.maxZ) / 2;
  const spanX = districtBounds.maxX - districtBounds.minX;
  const spanZ = districtBounds.maxZ - districtBounds.minZ;
  const maxSpan = Math.max(42, spanX, spanZ);
  return { centerX, centerZ, maxSpan };
}

const _fitBox = new THREE.Box3();
const _fitSize = new THREE.Vector3();

/** Frame every visible building in the camera view (used when nothing is selected). */
function framingForAllBuildings(
  buildings: CodeCityRenderableBuilding[],
  camera: THREE.PerspectiveCamera,
  fallbackCenter: THREE.Vector3,
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
  const distance = Math.max(distX, distY, distZ) * 1.32;

  target.y = Math.max(_fitSize.y * 0.28, 4);

  return {
    target,
    distance: Math.max(28, Math.min(distance, 360)),
  };
}

function orbitFocusForBuildings(
  buildings: CodeCityRenderableBuilding[],
  selectedBuildingId: string | null,
  cityCenter: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
): { target: THREE.Vector3; distance: number } {
  if (!selectedBuildingId || buildings.length === 0) {
    return framingForAllBuildings(buildings, camera, cityCenter);
  }
  const selected = buildings.find((b) => b.id === selectedBuildingId);
  if (!selected) {
    return framingForAllBuildings(buildings, camera, cityCenter);
  }
  const mates = buildings.filter((b) => b.path === selected.path);
  const target = new THREE.Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let maxHeight = 8;
  for (const mate of mates) {
    const c = buildingCenter(mate);
    target.add(c);
    minX = Math.min(minX, mate.x - mate.width / 2);
    maxX = Math.max(maxX, mate.x + mate.width / 2);
    minZ = Math.min(minZ, mate.z - mate.depth / 2);
    maxZ = Math.max(maxZ, mate.z + mate.depth / 2);
    maxHeight = Math.max(maxHeight, mate.height);
  }
  target.divideScalar(mates.length);
  const span = Math.max(maxX - minX, maxZ - minZ, 6);
  const distance = Math.max(18, Math.min(96, span * 1.35 + maxHeight * 1.8));
  return { target, distance };
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

function createBuildingGroup(building: CodeCityRenderableBuilding): THREE.Group {
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
  buildingGroup.add(mesh);

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
      ctx.districtsGroup.add(mesh);
    }
    mesh.position.set(district.x, -0.5, district.z);
    mesh.scale.set(1, 1, 1);
  }
}

function syncBuildingMeshes(
  ctx: SceneContext,
  buildings: CodeCityRenderableBuilding[],
) {
  const nextIds = new Set(buildings.map((b) => b.id));
  for (const [id, group] of [...ctx.buildingGroups.entries()]) {
    if (!nextIds.has(id)) {
      ctx.buildingsRoot.remove(group);
      disposeObject3D(group);
      ctx.buildingGroups.delete(id);
    }
  }
  for (const building of buildings) {
    let group = ctx.buildingGroups.get(building.id);
    if (!group) {
      group = createBuildingGroup(building);
      ctx.buildingGroups.set(building.id, group);
      ctx.buildingsRoot.add(group);
    } else {
      group.position.set(building.x, 0, building.z);
      attachSelectable(group, building);
      const mesh = group.children.find((c) => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
      if (mesh) {
        mesh.position.set(0, building.height / 2, 0);
      }
    }
  }
}

export function CodeCityView({
  layout,
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

    const width = floatChrome
      ? Math.max(64, mount.clientWidth || 320)
      : Math.max(320, mount.clientWidth || 960);
    const height = floatChrome
      ? Math.max(48, mount.clientHeight || 240)
      : Math.max(420, mount.clientHeight || 560);
    const bounds = computeLayoutBounds(layoutRef.current);
    const cityCenter = new THREE.Vector3(bounds.centerX, Math.max(6, bounds.maxSpan * 0.06), bounds.centerZ);

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: floatChrome });
    if (floatChrome) {
      renderer.setClearColor(0x000000, 0);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

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

    const orbitTarget = cityCenter.clone();
    const orbitDistance = Math.max(48, bounds.maxSpan * 0.95);

    const ctx: SceneContext = {
      scene,
      camera,
      controls,
      renderer,
      districtsGroup,
      buildingsRoot,
      buildingGroups: new Map(),
      edgeGroup,
      districtMaterial,
      centerX: bounds.centerX,
      centerZ: bounds.centerZ,
      maxSpan: bounds.maxSpan,
      orbitTarget,
      orbitDistance,
      frame: 0,
    };
    ctxRef.current = ctx;

    syncDistrictMeshes(ctx, layoutRef.current.districts);
    syncBuildingMeshes(ctx, layoutRef.current.buildings);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickBuilding = (event: PointerEvent): CodeCityRenderableBuilding | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(buildingsRoot.children, true)
        .find((entry: THREE.Intersection<THREE.Object3D>) =>
          Boolean(entry.object.userData?.building),
        );
      return (hit?.object.userData?.building as CodeCityRenderableBuilding | null) ?? null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      const building = pickBuilding(event);
      if (event.detail >= 2) {
        if (building && onEnterRef.current) {
          onEnterRef.current(building);
        }
        return;
      }
      onSelectRef.current(building);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    const cityCenterVec = new THREE.Vector3();
    const lodDistance = bounds.maxSpan * 1.35;

    const render = () => {
      ctx.frame = window.requestAnimationFrame(render);
      const layoutNow = layoutRef.current;
      const selection = selectionRef.current;
      const boundsNow = computeLayoutBounds(layoutNow);
      ctx.centerX = boundsNow.centerX;
      ctx.centerZ = boundsNow.centerZ;
      ctx.maxSpan = boundsNow.maxSpan;

      cityCenterVec.set(boundsNow.centerX, Math.max(6, boundsNow.maxSpan * 0.06), boundsNow.centerZ);
      const hasSelection = Boolean(selection.selectedBuildingId);
      const focus = orbitFocusForBuildings(
        layoutNow.buildings,
        selection.selectedBuildingId,
        cityCenterVec,
        camera,
      );
      const distLerp = hasSelection ? 0.06 : 0.085;
      ctx.orbitDistance += (focus.distance - ctx.orbitDistance) * distLerp;
      const targetLerp = hasSelection ? 0.07 : 0.09;
      ctx.orbitTarget.lerp(focus.target, targetLerp);
      controls.target.lerp(ctx.orbitTarget, targetLerp + 0.01);

      controls.autoRotate = true;
      controls.autoRotateSpeed = hasSelection ? 0.55 : 0.38;

      const distFromTarget = camera.position.distanceTo(controls.target);
      const desiredDist = ctx.orbitDistance;
      const distEpsilon = hasSelection ? 1.5 : 0.8;
      if (Math.abs(distFromTarget - desiredDist) > distEpsilon) {
        const dir = camera.position.clone().sub(controls.target).normalize();
        const blended = controls.target.clone().add(dir.multiplyScalar(desiredDist));
        camera.position.lerp(blended, hasSelection ? 0.035 : 0.05);
      }

      controls.minDistance = Math.max(
        12,
        hasSelection ? boundsNow.maxSpan * 0.12 : focus.distance * 0.55,
      );
      controls.maxDistance = Math.max(
        120,
        hasSelection ? boundsNow.maxSpan * 4 : focus.distance * 1.85,
      );
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.far = boundsNow.maxSpan * 4.8;
        scene.fog.near = boundsNow.maxSpan * 1.5;
      }

      if (ctx.frame % 10 === 0) {
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

      controls.update();
      renderer.render(scene, camera);
    };
    render();

    const resizeObserver = new ResizeObserver((entries) => {
      const next = entries[0];
      if (!next) {
        return;
      }
      const nextWidth = Math.max(320, Math.floor(next.contentRect.width));
      const nextHeight = Math.max(420, Math.floor(next.contentRect.height));
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resizeObserver.observe(mount);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(ctx.frame);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      for (const group of ctx.buildingGroups.values()) {
        disposeObject3D(group);
      }
      ctx.districtsGroup.clear();
      controls.dispose();
      renderer.dispose();
      scene.clear();
      ctxRef.current = null;
      mount.replaceChildren();
    };
  }, [floatChrome]);

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
  }, [districtKey, layout.districts]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    syncBuildingMeshes(ctx, layout.buildings);
    const bounds = computeLayoutBounds(layout);
    ctx.centerX = bounds.centerX;
    ctx.centerZ = bounds.centerZ;
    ctx.maxSpan = bounds.maxSpan;
  }, [buildingIdsKey, layout.buildings]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }
    const buildingById = new Map(layout.buildings.map((b) => [b.id, b]));
    const selection = selectionRef.current;
    for (const [id, group] of ctx.buildingGroups) {
      const building = buildingById.get(id);
      if (!building) {
        continue;
      }
      const visual = visualStateForBuilding(id, building, selection);
      applyBuildingVisual(group, building, visual);
    }
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
