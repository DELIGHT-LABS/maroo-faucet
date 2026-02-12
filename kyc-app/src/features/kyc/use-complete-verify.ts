import { useMutation } from "@tanstack/react-query";

import { AlreadyVerifiedError, VerificationError } from "./error";

export const useCompleteVerify = () =>
  useMutation({
    mutationFn: async () => {
      // TODO: replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: parse 409 error from API response
      if (Math.random() < 0.7) {
        throw new AlreadyVerifiedError(
          "Verification failed. You have already verified your identity with a different wallet.",
        );
      }

      throw new VerificationError(
        "We couldn't verify your identity. Please try again.",
      );
    },
  });
