import { API_URL } from "~/shared/lib/env";

import { BalanceError, RateLimitError, withMessage } from "./error";

interface ChainConfig {
  ID: string;
  NAME: string;
  TOKEN: string;
  RPC: string;
  CHAINID: number;
  EXPLORER: string;
  DRIP_AMOUNT: number;
  MAX_BALANCE: number;
  RATELIMIT: {
    MAX_LIMIT: number;
    WINDOW_SIZE: number;
  };
}

// TODO: separate this to a common source for both server and client
const MOCK: ChainConfig = {
  ID: "MAROO_TESTNET",
  NAME: "Maroo Testnet",
  TOKEN: "tOKRW",
  RPC: "https://api.maroo-pretestnet.delightlabs.sh",
  CHAINID: 450815,
  EXPLORER: "https://maroo-devnet-explorer.delightlabs.team",
  DRIP_AMOUNT: 5000,
  MAX_BALANCE: 10000,
  RATELIMIT: {
    MAX_LIMIT: 5,
    WINDOW_SIZE: 10,
  },
};

export async function getChainConfigs(): Promise<ChainConfig[]> {
  let configs = [MOCK];

  try {
    const response = await fetch(`${API_URL}/api/getChainConfigs`);
    const data = (await response.json()) as { configs: ChainConfig[] };
    configs = data.configs;
  } catch {
    console.log("Failed to fetch chain configs, using MOCK data instead.");
    // it will fail silently and use MOCK data
    // most likely due to ip whitelisting issue in netlify deploy
  }

  return configs;
}

export async function requestTokens(params: {
  address: string;
  token: string;
}) {
  const response = await fetch(`${API_URL}/api/sendToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: params.address,
      chain: "MAROO_TESTNET",
      token: params.token,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Handle rate limit (429)
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 0;
      throw new RateLimitError(
        `You have reached the limit of ${MOCK.RATELIMIT.MAX_LIMIT} requests per ${MOCK.RATELIMIT.WINDOW_SIZE} minutes. Please try again later.`,
        retryAfter,
      );
    }

    // TODO: improve error from server
    if (withMessage(errorData) && errorData.message.includes("balance")) {
      throw new BalanceError(
        `You cannot request more tokens while holding ${MOCK.MAX_BALANCE} ${MOCK.TOKEN} or more.`,
      );
    }

    throw new Error("Network is congested. Please try again.");
  }

  return response.json() as unknown as { txHash: `0x${string}` };
}
