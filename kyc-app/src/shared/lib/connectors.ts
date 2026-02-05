import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  baseAccount,
  // geminiWallet,
  metaMaskWallet,
  // okxWallet,
  // safeWallet,
  // trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

import { WC_PROJECT_ID } from "./env";

export const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      // There is a SSR issue with WC-based conectors - https://github.com/rainbow-me/rainbowkit/issues/2476
      // will be fixed in the next release of rainbowkit
      wallets:
        typeof indexedDB !== "undefined"
          ? [metaMaskWallet, walletConnectWallet]
          : // just to avoid empty array error during SSR
            [baseAccount],
    },
    // TODO: Uncomment this once Maroo is progressively added to wallets via viem/chains, chainlist, etc.
    // Most wallets don't allow wallet_addEthereumChain for custom chains
    // {
    //   groupName: "Others",
    //   wallets: [baseAccount, safeWallet, okxWallet, trustWallet, geminiWallet]
    // },
  ],
  {
    appName: "Maroo Identity Verification",
    projectId: WC_PROJECT_ID,
    // appUrl: "http://localhost:3000", // TODO update this
  },
);
