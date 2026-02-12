import { useMutation } from "@tanstack/react-query";

import { kycApi } from "~/shared/api/kyc-api";

import {
  AlreadyVerifiedError,
  isKycServerError,
  VerificationError,
} from "./error";

export const useCompleteVerify = () =>
  useMutation({
    mutationFn: async () => {
      try {
        const { data } = await kycApi.api.kycControllerVerify();
        return data;
      } catch (e: unknown) {
        if (isKycServerError(e)) {
          // TODO: better error handling
          if (e.message.includes("already")) {
            throw new AlreadyVerifiedError(
              "Verification failed. You have already verified your identity with a different wallet.",
            );
          }

          // more 409 errors
        }

        throw new VerificationError(
          "We couldn't verify your identity. Please try again.",
        );
      }
    },
  });
