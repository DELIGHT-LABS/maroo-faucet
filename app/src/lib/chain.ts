import { defineChain } from "viem";

const marooLocalnet = defineChain({
  id: 815,
  name: "Maroo Local Testnet",
  nativeCurrency: { name: "Maroo", symbol: "okrw", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  // blockExplorers: {
  //   default: {
  //     name: "Lux Explorer",
  //     url: "https://explorer.lux.network",
  //   },
  // },
  testnet: true,
});

const marooTestnet = defineChain({
  id: 815,
  name: "Maroo Testnet",
  nativeCurrency: { name: "Maroo", symbol: "okrw", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://35.216.60.196:8545"] },
  },
  // blockExplorers: {
  //   default: {
  //     name: "Maroo Explorer",
  //     url: "http://35.216.60.196:8545",
  //   },
  // },
  testnet: true,
});

export const maroo =
  process.env.NEXT_PUBLIC_MAROO_ID === "MAROO_LOCALNET"
    ? marooLocalnet
    : marooTestnet;
