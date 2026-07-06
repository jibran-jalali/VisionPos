import type { ProfileData, MatchResult } from "./types";

const CONFIDENCE_THRESHOLD = 0.82;

export function computeHistogram(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const total = pixels.length / 4;

  const hBins = 8, sBins = 8, vBins = 8;
  const histH = new Float32Array(hBins);
  const histS = new Float32Array(sBins);
  const histV = new Float32Array(vBins);

  for (let i = 0; i < pixels.length; i += 4) {
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
    const hi = Math.min(Math.floor(h * hBins), hBins - 1);
    const si = Math.min(Math.floor(s * sBins), sBins - 1);
    const vi = Math.min(Math.floor(v * vBins), vBins - 1);
    histH[hi]++; histS[si]++; histV[vi]++;
  }

  for (let i = 0; i < hBins; i++) histH[i] /= total;
  for (let i = 0; i < sBins; i++) histS[i] /= total;
  for (let i = 0; i < vBins; i++) histV[i] /= total;

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

export function matchFrame(frameBlob: Blob, profiles: ProfileData[]): Promise<MatchResult | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const query = computeHistogram(canvas);

      let best: { productId: string; productName: string | null; sku: string | null; score: number } | null = null;

      for (const profile of profiles) {
        if (!profile.embeddings || profile.embeddings.length === 0) continue;
        let maxScore = 0;
        for (const emb of profile.embeddings) {
          const score = cosineSimilarity(query, emb);
          if (score > maxScore) maxScore = score;
        }
        if (!best || maxScore > best.score) {
          best = { productId: profile.productId, productName: profile.productName, sku: profile.sku, score: maxScore };
        }
      }

      if (!best) {
        resolve(null);
        return;
      }

      resolve({
        productId: best.productId,
        productName: best.productName,
        sku: best.sku,
        score: Math.round(best.score * 10000) / 10000,
        accepted: best.score >= CONFIDENCE_THRESHOLD,
        matchType: "vision",
      });
    };
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = URL.createObjectURL(frameBlob);
  });
}
