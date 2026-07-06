export type VisionAgentHealth = {
  status: string;
  service: string;
  version: string;
  cache_ready: boolean;
};

export type MatchCandidate = {
  product_id: string;
  product_name: string | null;
  sku: string | null;
  score: number;
  accepted: boolean;
  match_type: string;
};

export type MatchImageResponse = {
  match: MatchCandidate | null;
  candidates: MatchCandidate[];
  barcode_detected: string | null;
};

export type ProcessVideoResponse = {
  product_id: string;
  product_name: string | null;
  frame_count: number;
  embedding_count: number;
  profile_status: string;
  embedding_model: string;
  updated_at: string;
};

export const VISION_AGENT_URL = "http://127.0.0.1:8767";

export type SyncProductItem = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number | null;
  is_active: boolean;
};

export async function syncProductsToAgent(products: SyncProductItem[]): Promise<{ synced: number; product_ids: string[] }> {
  const response = await fetch(`${VISION_AGENT_URL}/sync-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Could not sync products to Vision Agent");
  }

  return response.json();
}

export async function getVisionAgentHealth(signal?: AbortSignal): Promise<VisionAgentHealth> {
  const response = await fetch(`${VISION_AGENT_URL}/health`, {
    method: "GET",
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Vision Agent is not reachable");
  }

  return response.json() as Promise<VisionAgentHealth>;
}

export async function matchFrame(frame: Blob): Promise<MatchImageResponse> {
  const body = new FormData();
  body.append("frame", frame, "checkout-frame.jpg");
  body.append("top_k", "3");

  const response = await fetch(`${VISION_AGENT_URL}/match-frame`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Could not match camera frame");
  }

  return response.json() as Promise<MatchImageResponse>;
}

export async function processProductImages(input: {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  images: File[];
}): Promise<ProcessVideoResponse> {
  const body = new FormData();
  body.append("product_id", input.productId);
  body.append("product_name", input.productName);
  body.append("sku", input.sku);
  if (input.barcode) body.append("barcode", input.barcode);
  for (const image of input.images) {
    body.append("images", image);
  }

  const response = await fetch(`${VISION_AGENT_URL}/process-images`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Could not process product images");
  }

  return response.json() as Promise<ProcessVideoResponse>;
}

export async function processProductVideo(input: {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  video: File;
}): Promise<ProcessVideoResponse> {
  const body = new FormData();
  body.append("product_id", input.productId);
  body.append("product_name", input.productName);
  body.append("sku", input.sku);
  if (input.barcode) body.append("barcode", input.barcode);
  body.append("video", input.video);

  const response = await fetch(`${VISION_AGENT_URL}/process-video-upload`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Could not process product video");
  }

  return response.json() as Promise<ProcessVideoResponse>;
}
