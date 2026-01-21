import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  noopStorage,
} from "wagmi";

import { maroo, marooLocalnet, marooTestnet } from "./chain";
import { connectors } from "./connectors";

export function getConfig() {
  return createConfig({
    chains: [maroo],
    connectors,
    // Use noopStorage for SSR to completely disable persistence on server
    storage: createStorage({
      storage: typeof window !== "undefined" ? cookieStorage : noopStorage,
    }),
    ssr: true,
    transports: {
      [marooLocalnet.id]: http(),
      [marooTestnet.id]: http(),
    },
  });
}

export const config = getConfig();

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
