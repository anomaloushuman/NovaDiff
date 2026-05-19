import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  type CodeCityLayoutResult,
  type CodeCityRenderableBuilding,
} from "../app/codeCityLayout";

function attachSelectable(object: THREE.Object3D, building: CodeCityRenderableBuilding) {
  object.userData.building = building;
  for (const child of object.children) {
    attachSelectable(child, building);
  }
}

export function CodeCityView({
  layout,
  rootSide,
  compareOverlay,
  blameOverlay,
  selectedBuildingId,
  onSelect,
}: {
  layout: CodeCityLayoutResult;
  rootSide: "baseline" | "target";
  compareOverlay: boolean;
  blameOverlay: boolean;
  selectedBuildingId: string | null;
  onSelect: (building: CodeCityRenderableBuilding | null) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }
    mount.replaceChildren();
    const width = Math.max(320, mount.clientWidth || 960);
    const height = Math.max(420, mount.clientHeight || 560);
    const districtBounds = layout.districts.length
      ? {
          minX: Math.min(...layout.districts.map((district) => district.x - district.width / 2)),
          maxX: Math.max(...layout.districts.map((district) => district.x + district.width / 2)),
          minZ: Math.min(...layout.districts.map((district) => district.z - district.depth / 2)),
          maxZ: Math.max(...layout.districts.map((district) => district.z + district.depth / 2)),
        }
      : { minX: 0, maxX: 48, minZ: 0, maxZ: 48 };
    const centerX = (districtBounds.minX + districtBounds.maxX) / 2;
    const centerZ = (districtBounds.minZ + districtBounds.maxZ) / 2;
    const spanX = districtBounds.maxX - districtBounds.minX;
    const spanZ = districtBounds.maxZ - districtBounds.minZ;
    const maxSpan = Math.max(42, spanX, spanZ);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07101a);
    scene.fog = new THREE.Fog(0x07101a, maxSpan * 1.5, maxSpan * 4.8);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
    camera.position.set(
      centerX + maxSpan * 0.92,
      Math.max(42, maxSpan * 0.95),
      centerZ + maxSpan * 1.06,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(centerX, Math.max(6, maxSpan * 0.06), centerZ);
    controls.minDistance = Math.max(18, maxSpan * 0.3);
    controls.maxDistance = Math.max(120, maxSpan * 4);

    scene.add(new THREE.AmbientLight(0x9fb8d1, 1.9));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(centerX + maxSpan, maxSpan * 1.8, centerZ + maxSpan * 0.6);
    scene.add(dirLight);

    const gridSize = Math.max(120, Math.ceil((maxSpan * 3) / 20) * 20);
    const gridDivisions = Math.max(24, Math.round(gridSize / 6));
    const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x173149, 0x102535);
    grid.position.x = centerX;
    grid.position.z = centerZ;
    grid.position.y = -0.1;
    scene.add(grid);

    const districtMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d1d2d,
      transparent: true,
      opacity: 0.92,
      metalness: 0.05,
      roughness: 0.92,
    });
    for (const district of layout.districts) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(district.width + 6, 0.8, district.depth + 6),
        districtMaterial.clone(),
      );
      mesh.position.set(district.x, -0.5, district.z);
      scene.add(mesh);
    }

    const group = new THREE.Group();
    for (const building of layout.buildings) {
      const buildingGroup = new THREE.Group();
      const isSelected = selectedBuildingId === building.id;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(building.color),
        emissive: new THREE.Color(building.emissive),
        emissiveIntensity: isSelected ? 1.05 : building.isGhost ? 0.25 : 0.55,
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
      buildingGroup.add(mesh);

      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(building.width, building.height, building.depth)),
        new THREE.LineBasicMaterial({
          color: isSelected ? 0xf7fbff : building.isGhost ? 0x7c90a6 : 0xc2e7ff,
          transparent: true,
          opacity: isSelected ? 0.8 : building.isGhost ? 0.25 : 0.16,
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
          const z = -building.depth / 2 + 0.55 + col * ((building.depth - 1.1) / Math.max(1, cols - 1));
          const front = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.38), windowMaterial);
          front.position.set(insetX, y, z);
          const back = front.clone();
          back.position.x = -insetX;
          buildingGroup.add(front);
          buildingGroup.add(back);
        }
      }

      buildingGroup.position.set(building.x, 0, building.z);
      if (isSelected) {
        buildingGroup.scale.setScalar(1.04);
      }
      attachSelectable(buildingGroup, building);
      group.add(buildingGroup);
    }
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(group.children, true)
        .find((entry: THREE.Intersection<THREE.Object3D>) =>
          Boolean(entry.object.userData?.building),
        );
      onSelect((hit?.object.userData?.building as CodeCityRenderableBuilding | null) ?? null);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    let frame = 0;
    const render = () => {
      frame = window.requestAnimationFrame(render);
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
      window.cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      mount.replaceChildren();
    };
  }, [layout, onSelect, selectedBuildingId]);

  if (layout.buildings.length === 0) {
    return (
      <div className="code-city-empty">
        No buildings match the current filters. Try a different root, subsystem, or
        search query.
      </div>
    );
  }

  return (
    <div className="code-city-shell">
      <div className="code-city-canvas-wrap">
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
            Drag to orbit, scroll to zoom, and click a building for symbol details.
          </p>
        </div>
        <div ref={mountRef} className="code-city-canvas" />
      </div>
      <div className="code-city-footnote">
        {layout.buildings.length} symbol building{layout.buildings.length === 1 ? "" : "s"} ·{" "}
        {layout.districts.length} district{layout.districts.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
