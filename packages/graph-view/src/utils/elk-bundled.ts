/** ELK layout engine — import shim for Vite/Electron (UMD bundle has no ESM default). */

export type ElkLayoutInstance = {
  layout(graph: unknown): Promise<unknown>;
};

export type ElkConstructor = new () => ElkLayoutInstance;

function resolveElkConstructor(mod: Record<string, unknown>): ElkConstructor {
  const candidate = mod.default ?? mod.ELK;
  if (typeof candidate === "function") {
    return candidate as ElkConstructor;
  }
  throw new Error("elkjs bundled module did not export an ELK constructor");
}

let ctorPromise: Promise<ElkConstructor> | null = null;

export function loadElkConstructor(): Promise<ElkConstructor> {
  if (!ctorPromise) {
    ctorPromise = import("elkjs/lib/elk.bundled.js").then((mod) =>
      resolveElkConstructor(mod as Record<string, unknown>),
    );
  }
  return ctorPromise;
}

let instancePromise: Promise<ElkLayoutInstance> | null = null;

export function loadElk(): Promise<ElkLayoutInstance> {
  if (!instancePromise) {
    instancePromise = loadElkConstructor().then((Ctor) => new Ctor());
  }
  return instancePromise;
}
