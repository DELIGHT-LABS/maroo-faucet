import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { createSiweMessage } from "viem/siwe";

import { authActions } from "./auth-store";

// TODO: separate api logics
// const endPoints = {
//   nonce: "TODO: replace with your nonce endpoint",
//   verify: "TODO: replace with your verify endpoint",
//   logout: "TODO: replace with your logout endpoint",
// } as const;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const siweAuthAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    // This will stay the same for the production,
    // since we get the created message with generated nonce from server
    // longer than 8, alphanumeric to pass viem validation
    return "alphanumeric";
  },
  createMessage: ({ nonce, address, chainId }) => {
    // TODO: this should be done on the server side
    return createSiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
    });
  },
  verify: async () => {
    await delay(500); // simulate network delay
    authActions.login();
    return true;
    // const verifyRes = await fetch(endPoints.verify, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ message, signature }),
    // });
    // if (verifyRes.ok) {
    //   authActions.login();
    //   return true;
    // }
    // return false;
  },
  signOut: async () => {
    await delay(500); // simulate network delay
    authActions.logout();
    // await fetch(endPoints.logout);
  },
});
