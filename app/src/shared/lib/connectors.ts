import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  baseAccount,
  geminiWallet,
  metaMaskWallet,
  okxWallet,
  safeWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { WC_PROJECT_ID } from "./env";

export const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      // workaround for SSR issue - https://github.com/rainbow-me/rainbowkit/issues/2476
      // baseAccount for populating array, otherwise it'd complain for an empty array
      wallets:
        typeof indexedDB !== "undefined"
          ? [metaMaskWallet, walletConnectWallet]
          : [baseAccount],
    },
    {
      groupName: "Others",
      wallets:
        typeof indexedDB !== "undefined"
          ? [baseAccount, safeWallet, okxWallet, trustWallet, geminiWallet]
          : [baseAccount],
    },
  ],
  {
    appName: "Maroo Faucet",
    projectId: WC_PROJECT_ID,
    appUrl: "http://localhost:3000", // TODO update this
  },
);
