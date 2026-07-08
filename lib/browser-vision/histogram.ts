import type { ProfileData, MatchResult } from "./types";

const CONFIDENCE_THRESHOLD = 0.92;

export function computeHistogram(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width, h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const pixels = imageData.data;

  const hBins = 12, sBins = 6, vBins = 6;
  const histH = new Float32Array(hBins);
  const histS = new Float32Array(sBins);
  const histV = new Float32Array(vBins);
  const cx = w / 2, cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  let totalWeight = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = pixels[i] / 255, g = pixels[i + 1] / 255, b = pixels[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const delta = max - min;
      const v = max;
      let h = 0, s = 0;

      if (delta !== 0) {
        s = delta / max;
        if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / delta + 2) / 6;
        else h = ((r - g) / delta + 4) / 6;
      }

      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const weight = 1 + Math.max(0, 1 - dist / maxDist);
      totalWeight += weight;

      const hi = Math.min(Math.floor(h * hBins), hBins - 1);
      const si = Math.min(Math.floor(s * sBins), sBins - 1);
      const vi = Math.min(Math.floor(v * vBins), vBins - 1);
      histH[hi] += weight;
      histS[si] += weight;
      histV[vi] += weight;
    }
  }

  for (let i = 0; i < hBins; i++) histH[i] /= totalWeight;
  for (let i = 0; i < sBins; i++) histS[i] /= totalWeight;
  for (let i = 0; i < vBins; i++) histV[i] /= totalWeight;

  return [...Array.from(histH), ...Array.from(histS), ...Array.from(histV)];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function matchHistogram(query: number[], profiles: ProfileData[]): MatchResult | null {
  type ScoredMatch = { productId: string; productName: string | null; sku: string | null; score: number };
  let best: ScoredMatch | null = null;
  let secondBest: ScoredMatch | null = null;

  for (const profile of profiles) {
    if (!profile.embeddings || profile.embeddings.length === 0) continue;
    let maxScore = 0;
    for (const emb of profile.embeddings) {
      const score = cosineSimilarity(query, emb);
      if (score > maxScore) maxScore = score;
    }
    if (!best || maxScore > best.score) {
      secondBest = best;
      best = { productId: profile.productId, productName: profile.productName, sku: profile.sku, score: maxScore };
    } else if (!secondBest || maxScore > secondBest.score) {
      secondBest = { productId: profile.productId, productName: profile.productName, sku: profile.sku, score: maxScore };
    }
  }

  if (!best) return null;

  const margin = best.score - (secondBest?.score ?? 0);
  const accepted = best.score >= CONFIDENCE_THRESHOLD && margin > 0.15;

  return {
    productId: best.productId,
    productName: best.productName,
    sku: best.sku,
    score: Math.round(best.score * 10000) / 10000,
    accepted,
    matchType: "vision",
  };
}

export function matchCanvas(canvas: HTMLCanvasElement, profiles: ProfileData[]): MatchResult | null {
  return matchHistogram(computeHistogram(canvas), profiles);
}

export async function matchCanvasAll(
  canvas: HTMLCanvasElement,
  profiles: ProfileData[],
  options: { useMobileNet?: boolean; mobileNetTimeoutMs?: number } = {},
): Promise<MatchResult | null> {
  if (!profiles.length) return null;

  const hsvQuery = computeHistogram(canvas);
  let mobilenetQuery: number[] | null = null;
  const hasMobilenet = profiles.some((p) => p.embeddingModel === "mobilenet_v2");
  if (hasMobilenet && options.useMobileNet !== false) {
    try {
      const { extractFeatures } = await import("./mobilenet");
      const timeoutMs = options.mobileNetTimeoutMs ?? 900;
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
      mobilenetQuery = await Promise.race([extractFeatures(canvas), timeout]);
    } catch {}
  }

  function resolveQuery(profile: ProfileData): number[] | null {
    if (profile.embeddingModel === "mobilenet_v2") return mobilenetQuery;
    return hsvQuery;
  }

  type ScoredMatch = { productId: string; productName: string | null; sku: string | null; score: number };
  let best: ScoredMatch | null = null;
  let secondBest: ScoredMatch | null = null;

  for (const profile of profiles) {
    if (!profile.embeddings || profile.embeddings.length === 0) continue;
    const query = resolveQuery(profile);
    if (!query) continue;

    let maxScore = 0;
    for (const emb of profile.embeddings) {
      const score = cosineSimilarity(query, emb);
      if (score > maxScore) maxScore = score;
    }
    if (!best || maxScore > best.score) {
      secondBest = best;
      best = { productId: profile.productId, productName: profile.productName, sku: profile.sku, score: maxScore };
    } else if (!secondBest || maxScore > secondBest.score) {
      secondBest = { productId: profile.productId, productName: profile.productName, sku: profile.sku, score: maxScore };
    }
  }

  if (!best) return null;

  const margin = best.score - (secondBest?.score ?? 0);
  const accepted = best.score >= CONFIDENCE_THRESHOLD && margin > 0.15;

  return {
    productId: best.productId,
    productName: best.productName,
    sku: best.sku,
    score: Math.round(best.score * 10000) / 10000,
    accepted,
    matchType: "vision",
  };
}

export function matchFrame(frameBlob: Blob, profiles: ProfileData[]): Promise<MatchResult | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 320;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(matchCanvas(canvas, profiles));
    };
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = URL.createObjectURL(frameBlob);
  });
}
