import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  noopStorage,
} from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";

import { maroo } from "./chain";

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
