import { defineChain } from "viem";
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  noopStorage,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

// Define Lux chains (own fork with own consensus, not Avalanche)
export const lux = defineChain({
  id: 96369,
  name: "Lux Mainnet",
  nativeCurrency: { name: "Lux", symbol: "LUX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.lux.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Lux Explorer",
      url: "https://explorer.lux.network",
    },
  },
});

export const luxTestnet = defineChain({
  id: 96368,
  name: "Lux Testnet",
  nativeCurrency: { name: "Lux", symbol: "LUX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.lux-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Lux Testnet Explorer",
      url: "https://explorer.lux-test.network",
    },
  },
  testnet: true,
});

// Localhost for testing with Foundry/Anvil
export const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
});

// Define Lux subnet chains
const wagmiTestnet = defineChain({
  id: 11111,
  name: "WAGMI Testnet",
  nativeCurrency: { name: "WAGMI", symbol: "WGM", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://subnets.lux.network/wagmi/wagmi-chain-testnet/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "WAGMI Explorer",
      url: "https://subnets.lux.network/wagmi/wagmi-chain-testnet/explorer",
    },
  },
  testnet: true,
});

export function getConfig() {
  return createConfig({
    chains: [localhost, mainnet, lux, luxTestnet, wagmiTestnet],
    connectors: [
      injected(),
      coinbaseWallet({ appName: "Lux Faucet" }),
      walletConnect({ projectId }),
    ],
    // Use noopStorage for SSR to completely disable persistence on server
    storage: createStorage({
      storage: typeof window !== "undefined" ? cookieStorage : noopStorage,
    }),
    ssr: true,
    transports: {
      [localhost.id]: http(),
      [mainnet.id]: http(),
      [lux.id]: http(),
      [luxTestnet.id]: http(),
      [wagmiTestnet.id]: http(),
    },
  });
}

export const config = getConfig();

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
