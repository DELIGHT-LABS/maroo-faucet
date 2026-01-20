import { defineChain } from "viem";

export const marooLocalnet = defineChain({
  id: 31337,
  name: "Maroo Local Testnet",
  nativeCurrency: { name: "Maroo", symbol: "okrw", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.WAKU_PUBLIC_MAROO_LOCALNET_RPC ||
          "http://127.0.0.1:8545",
      ],
    },
  },
  // blockExplorers: {
  //   default: {
  //     name: "Lux Explorer",
  //     url: "https://explorer.lux.network",
  //   },
  // },
  testnet: true,
});

export const marooTestnet = defineChain({
  id: 450815,
  name: "Maroo Testnet",
  nativeCurrency: { name: "Maroo", symbol: "okrw", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        import.meta.env.WAKU_PUBLIC_MAROO_TESTNET_RPC ||
          "http://35.216.60.196:8545",
      ],
    },
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
  import.meta.env.WAKU_PUBLIC_MAROO_ID === "MAROO_LOCALNET"
    ? marooLocalnet
    : marooTestnet;
