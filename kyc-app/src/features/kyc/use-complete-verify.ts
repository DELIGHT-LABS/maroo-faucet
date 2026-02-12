import { useMutation } from "@tanstack/react-query";

import { kycApi } from "~/shared/api/kyc-api";

import { AlreadyVerifiedError, VerificationError } from "./error";

export const useCompleteVerify = () =>
  useMutation({
    mutationFn: async () => {
      const { data, status, ok } = await kycApi.api.kycControllerVerify();

      if (ok) {
        return data;
      }

      if (status === 409) {
        throw new AlreadyVerifiedError(
          "Verification failed. You have already verified your identity with a different wallet.",
        );
      }

      throw new VerificationError(
        "We couldn't verify your identity. Please try again.",
      );
    },
  });
