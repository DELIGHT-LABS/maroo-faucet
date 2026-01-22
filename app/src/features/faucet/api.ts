import { API_URL } from "~/shared/lib/env";

import { RateLimitError } from "./error";

interface ChainConfig {
  ID: string;
  NAME: string;
  TOKEN: string;
  RPC: string;
  CHAINID: number;
  EXPLORER: string;
  DRIP_AMOUNT: number;
  RATELIMIT: {
    MAX_LIMIT: number;
    WINDOW_SIZE: number;
  };
}

// TODO: remove mock once backend is ready
const MOCK: ChainConfig = {
  ID: "MAROO_TESTNET",
  NAME: "Maroo Testnet",
  TOKEN: "OKRW",
  RPC: "https://api.maroo-pretestnet.delightlabs.sh",
  CHAINID: 450815,
  EXPLORER: "https://www.maroo.io",
  DRIP_AMOUNT: 100000,
  RATELIMIT: {
    MAX_LIMIT: 5,
    WINDOW_SIZE: 10,
  },
};

export async function getChainConfigs(): Promise<ChainConfig[]> {
  // const response = await fetch(`${API_URL}/api/getChainConfigs`);
  // const data = await response.json();
  // return data.configs as ChainConfig[];
  return [MOCK];
}

export async function requestTokens(params: {
  address: string;
  chain: string;
  token: string;
}) {
  const response = await fetch(`${API_URL}/api/sendToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: params.address,
      chain: params.chain,
      token: params.token,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Handle rate limit (429)
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 0;
      throw new RateLimitError(
        errorData.message || "Too many requests",
        retryAfter,
      );
    }

    throw new Error(errorData.message || "Failed to request token");
  }

  return response.json() as unknown as { txHash: `0x${string}` };
}
