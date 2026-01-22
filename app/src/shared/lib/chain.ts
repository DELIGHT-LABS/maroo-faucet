import { defineChain } from "viem";

import { LOCALNETL_PRC, MAROO_ID, TESTNET_RPC } from "./env";

export const marooLocalnet = defineChain({
  id: 31337,
  name: "Maroo Local Testnet",
  nativeCurrency: { name: "Maroo", symbol: "okrw", decimals: 18 },
  rpcUrls: {
    default: {
      http: [LOCALNETL_PRC],
    },
  },
  blockExplorers: {
    default: {
      name: "Maroo Explorer",
      url: "https://www.maroo.io/", // TODO update this
    },
  },
  testnet: true,
});

export const marooTestnet = defineChain({
  id: 450815,
  name: "Maroo Testnet",
  nativeCurrency: { name: "Maroo", symbol: "okrw", decimals: 18 },
  rpcUrls: {
    default: {
      http: [TESTNET_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: "Maroo Explorer",
      url: "https://www.maroo.io/", // TODO update this
    },
  },
  testnet: true,
});

export const maroo =
  MAROO_ID === "MAROO_LOCALNET" ? marooLocalnet : marooTestnet;
