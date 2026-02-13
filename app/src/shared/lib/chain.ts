import { defineChain } from "viem";

export const marooTestnet = defineChain({
  id: 450815,
  name: "Maroo Testnet",
  nativeCurrency: { name: "Maroo", symbol: "tOKRW", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://api.maroo-pretestnet.delightlabs.sh"],
    },
  },
  blockExplorers: {
    default: {
      name: "Maroo Explorer",
      url: "https://explorer-testnet.maroo.io",
    },
  },
  testnet: true,
});
