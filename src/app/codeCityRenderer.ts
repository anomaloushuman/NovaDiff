import * as THREE from "three";

export type CityRendererBackend = "webgpu" | "webgl";

export interface CityRenderer {
  renderer: THREE.WebGLRenderer;
  backend: CityRendererBackend;
  dispose: () => void;
}

export interface CreateCityRendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  alpha: boolean;
  antialias: boolean;
  pixelRatio: number;
  /** Prefer WebGPU on the full Code Map / explore page. */
  preferWebGpu: boolean;
}

/**
 * WebGPU when available (three/webgpu), otherwise WebGL with MSAA.
 * OrbitControls and MeshStandardMaterial work with both backends in r184+.
 */
export async function createCityRenderer(
  options: CreateCityRendererOptions,
): Promise<CityRenderer> {
  const common = {
    canvas: options.canvas,
    antialias: options.antialias,
    alpha: options.alpha,
    powerPreference: "high-performance" as const,
  };

  if (options.preferWebGpu && typeof navigator !== "undefined" && navigator.gpu) {
    try {
      const { WebGPURenderer } = await import("three/webgpu");
      if (WebGPURenderer) {
        const renderer = new WebGPURenderer(common);
        const init = (
          renderer as unknown as { init?: () => Promise<void> }
        ).init;
        if (init) {
          await init.call(renderer);
        }
        renderer.setPixelRatio(options.pixelRatio);
        renderer.setSize(options.width, options.height, false);
        if (options.alpha) {
          renderer.setClearColor(0x000000, 0);
        }
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        return {
          renderer: renderer as unknown as THREE.WebGLRenderer,
          backend: "webgpu",
          dispose: () => renderer.dispose(),
        };
      }
    } catch (e) {
      console.warn("[CodeCity] WebGPU unavailable, using WebGL:", e);
    }
  }

  const renderer = new THREE.WebGLRenderer(common);
  if (options.alpha) {
    renderer.setClearColor(0x000000, 0);
  }
  renderer.setPixelRatio(options.pixelRatio);
  renderer.setSize(options.width, options.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  return {
    renderer,
    backend: "webgl",
    dispose: () => renderer.dispose(),
  };
}
