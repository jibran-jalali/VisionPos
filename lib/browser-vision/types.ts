export type ProfileData = {
  productId: string;
  productName: string;
  sku: string | null;
  embeddings: number[][];
  frameCount: number;
};

export type MatchResult = {
  productId: string;
  productName: string | null;
  sku: string | null;
  score: number;
  accepted: boolean;
  matchType: "barcode" | "vision";
};
