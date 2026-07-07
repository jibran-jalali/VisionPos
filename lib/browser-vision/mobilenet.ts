import type { MobileNet } from "@tensorflow-models/mobilenet";

let model: MobileNet | null = null;
let loadPromise: Promise<void> | null = null;

const LOAD_TIMEOUT = 8000;

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("MobileNet load timed out")), ms));
}

export async function ensureModelLoaded(): Promise<boolean> {
  if (model) return true;
  if (loadPromise) { await loadPromise; return model !== null; }

  loadPromise = (async () => {
    try {
      await Promise.race([
        Promise.all([
          import("@tensorflow/tfjs-core"),
          import("@tensorflow/tfjs-backend-webgl"),
          import("@tensorflow/tfjs-converter"),
        ]),
        timeout(LOAD_TIMEOUT),
      ]);
      const tf = await import("@tensorflow/tfjs-core");
      await tf.ready();
      const mobilenetModule = await import("@tensorflow-models/mobilenet");
      const loaded = await Promise.race([
        mobilenetModule.load({ version: 2, alpha: 1.0 }),
        timeout(LOAD_TIMEOUT),
      ]);
      model = loaded;
    } catch {
      model = null;
    }
  })();

  await loadPromise;
  return model !== null;
}

export async function extractFeatures(canvas: HTMLCanvasElement): Promise<number[] | null> {
  const ready = await ensureModelLoaded();
  if (!ready || !model) return null;

  try {
    const logits = model.infer(canvas, true);
    const features = Array.from(logits.dataSync()) as number[];
    logits.dispose();
    return features;
  } catch {
    return null;
  }
}

export function isReady(): boolean {
  return model !== null;
}

export const EMBEDDING_SIZE = 1024;
