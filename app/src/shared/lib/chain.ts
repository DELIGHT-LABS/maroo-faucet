import { defineChain } from "viem";

import { TESTNET_RPC } from "./env";

export const marooTestnet = defineChain({
  id: 450815,
  name: "Maroo Testnet",
  nativeCurrency: { name: "Maroo", symbol: "OKRW", decimals: 18 },
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
