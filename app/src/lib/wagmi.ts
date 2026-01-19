import { defineChain } from "viem";
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  noopStorage,
} from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";

// Define Lux chains (own fork with own consensus, not Avalanche)
export const maroo = defineChain({
  id: 815,
  name: "Maroo Testnet",
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

export function getConfig() {
  return createConfig({
    chains: [maroo],
    connectors: [injected(), coinbaseWallet({ appName: "Maroo Faucet" })],
    // Use noopStorage for SSR to completely disable persistence on server
    storage: createStorage({
      storage: typeof window !== "undefined" ? cookieStorage : noopStorage,
    }),
    ssr: true,
    transports: {
      [maroo.id]: http(),
    },
  });
}

export const config = getConfig();

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
