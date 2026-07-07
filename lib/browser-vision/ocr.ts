"use client";

let worker: any = null;
let workerLoading: Promise<any> | null = null;

async function getWorker() {
  if (worker) return worker;
  if (!workerLoading) {
    workerLoading = (async () => {
      const Tesseract = await import("tesseract.js");
      const w = await Tesseract.createWorker("eng", 1, {
        logger: () => {},
      });
      worker = w;
      return w;
    })();
  }
  return workerLoading;
}

export async function recognizeText(canvas: HTMLCanvasElement, timeoutMs = 5000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const w = await getWorker();
    if (controller.signal.aborted) return null;
    const { data } = await w.recognize(canvas);
    return (data.text || "").trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wordSimilarity(ocrText: string, productName: string): number {
  const ocrWords = ocrText.toLowerCase().split(/\s+/).filter(Boolean);
  const nameWords = productName.toLowerCase().split(/\s+/).filter(Boolean);
  if (!ocrWords.length || !nameWords.length) return 0;

  const ocrStr = ocrText.toLowerCase();
  const nameStr = productName.toLowerCase();

  if (ocrStr.includes(nameStr) || nameStr.includes(ocrStr)) return 1;

  const maxLen = Math.max(ocrStr.length, nameStr.length);
  const dist = levenshtein(ocrStr, nameStr);
  const editSim = 1 - dist / maxLen;
  if (editSim >= 0.5) return editSim;

  let matchCount = 0;
  for (const nw of nameWords) {
    for (const ow of ocrWords) {
      if (ow === nw) { matchCount += 1.5; break; }
      if (ow.includes(nw) || nw.includes(ow)) { matchCount += 1; break; }
      const wd = levenshtein(ow, nw);
      if (wd <= Math.max(1, Math.floor(nw.length * 0.3))) { matchCount += 1; break; }
    }
  }
  return Math.min(1, matchCount / nameWords.length);
}

export type OcrMatch = {
  productId: string;
  productName: string;
  score: number;
};

const OCR_CONFIDENCE = 0.6;

export function fuzzyMatchProduct(ocrText: string, products: { id: string; name: string }[]): OcrMatch | null {
  let best: OcrMatch | null = null;
  for (const product of products) {
    const score = wordSimilarity(ocrText, product.name);
    if (!best || score > best.score) {
      best = { productId: product.id, productName: product.name, score: Math.round(score * 100) / 100 };
    }
  }
  if (!best || best.score < OCR_CONFIDENCE) return null;
  return best;
}
