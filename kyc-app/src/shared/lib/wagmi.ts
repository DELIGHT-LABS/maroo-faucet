import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  noopStorage,
} from "wagmi";

import { marooTestnet } from "./chain";
import { connectors } from "./connectors";

export function getConfig() {
  return createConfig({
    chains: [marooTestnet],
    connectors,
    // Use noopStorage for SSR to completely disable persistence on server
    // We cannot use cookieStorage on server as req.headers is not accessible on SSG mode
    storage: createStorage({
      storage: typeof window !== "undefined" ? cookieStorage : noopStorage,
    }),
    ssr: true,
    transports: {
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
