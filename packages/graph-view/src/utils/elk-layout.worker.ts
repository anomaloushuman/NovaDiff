/**
 * Off-main-thread ELK layout. Keeps the UI responsive on large knowledge graphs.
 */
import { loadElkConstructor, type ElkLayoutInstance } from "./elk-bundled";

export interface ElkWorkerRequest {
  requestId: number;
  input: unknown;
}

export interface ElkWorkerSuccess {
  requestId: number;
  ok: true;
  positioned: unknown;
}

export interface ElkWorkerFailure {
  requestId: number;
  ok: false;
  error: string;
}

export type ElkWorkerResponse = ElkWorkerSuccess | ElkWorkerFailure;

let elkPromise: Promise<ElkLayoutInstance> | null = null;

function getElk(): Promise<ElkLayoutInstance> {
  if (!elkPromise) {
    elkPromise = loadElkConstructor().then((Ctor) => new Ctor());
  }
  return elkPromise;
}

self.onmessage = (event: MessageEvent<ElkWorkerRequest>) => {
  const { requestId, input } = event.data;
  void (async () => {
    try {
      const elk = await getElk();
      const positioned = await elk.layout(input);
      const msg: ElkWorkerSuccess = { requestId, ok: true, positioned };
      self.postMessage(msg);
    } catch (err) {
      const msg: ElkWorkerFailure = {
        requestId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(msg);
    }
  })();
};
