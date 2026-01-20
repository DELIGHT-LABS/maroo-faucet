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

export const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, walletConnectWallet],
    },
    {
      groupName: "Others",
      wallets: [baseAccount, safeWallet, geminiWallet, okxWallet, trustWallet],
    },
  ],
  {
    appName: "Maroo Faucet",
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
    appUrl: "http://localhost:3000", // TODO update this
  },
);
