export type VisionAgentHealth = {
  status: string;
  service: string;
  version: string;
  cache_ready: boolean;
};

export const VISION_AGENT_URL = "http://127.0.0.1:8767";

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
