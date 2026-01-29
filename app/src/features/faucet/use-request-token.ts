import { useMutation } from "@tanstack/react-query";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import { RECAPTCHA_SITE_KEY } from "~/shared/lib/env";

import { requestTokens } from "./api";

export const useRequestToken = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();
  return useMutation({
    mutationFn: async (params: { address: string }) => {
      if (!!RECAPTCHA_SITE_KEY && !executeRecaptcha) {
        throw new Error("ReCaptcha not loaded");
      }

      // TODO: separate recaptcha action to common
      const token = (await executeRecaptcha?.("faucetdrip")) ?? "";

      return requestTokens({
        address: params.address,
        token,
      });
    },
  });
};
