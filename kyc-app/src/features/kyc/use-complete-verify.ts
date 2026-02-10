import { useMutation } from "@tanstack/react-query";

import { VerificationError } from "./error";

export const useCompleteVerify = () =>
  useMutation({
    mutationFn: async () => {
      // TODO: replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      throw new VerificationError(
        "We couldn't verify your identity. Please try again.",
      );
    },
  });
