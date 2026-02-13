import { useMutation } from "@tanstack/react-query";

import { kycApi } from "~/shared/api/kyc-api";

import {
  AlreadyVerifiedError,
  extractKycServerError,
  NotCompletedError,
  VerificationError,
} from "./error";

export const useCompleteVerify = () =>
  useMutation({
    mutationFn: async () => {
      try {
        const { data } = await kycApi.api.kycControllerVerify();
        return data;
      } catch (e: unknown) {
        const kycError = extractKycServerError(e);

        if (kycError) {
          // TODO: better error handling
          if (kycError.message.includes("already")) {
            throw new AlreadyVerifiedError(
              "Verification failed. You have already verified your identity with a different wallet.",
            );
          }

          if (kycError.message.includes("not completed")) {
            throw new NotCompletedError(
              "Verification not completed. Please approve in KakaoTalk and and try again.",
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
