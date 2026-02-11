import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";

import { kycApi } from "~/shared/api/kyc-api";
import { authActions } from "./auth-store";

export const siweAuthAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    // This will stay the same for the production,
    // since we get the created message with generated nonce from server
    // longer than 8, alphanumeric to pass viem validation
    return "alphanumeric";
  },
  createMessage: async ({ address }) => {
    const { data } = await kycApi.api.authControllerMessage({ address });

    return data.message;
  },
  verify: async ({ message, signature }) => {
    const { data, ok } = await kycApi.api.authControllerSignIn({
      message,
      signature,
    });

    // TODO: handle error
    if (ok) {
      authActions.login(data.verified);
      return true;
    }

    return false;
  },
  signOut: async () => {
    authActions.logout();
    await kycApi.api.authControllerLogout();
  },
});
