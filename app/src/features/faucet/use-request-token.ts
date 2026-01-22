import { useMutation } from "@tanstack/react-query";
// import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import { requestTokens } from "./api";

export const useRequestToken = () => {
  // const { executeRecaptcha } = useGoogleReCaptcha();
  return useMutation({
    mutationFn: async (params: { address: string; chain: string }) => {
      // if (!executeRecaptcha) {
      //   throw new Error("ReCaptcha not loaded");
      // }

      // const token = await executeRecaptcha("faucet_request");

      return requestTokens({
        address: params.address,
        chain: params.chain,
        token: "", // TODO: enable recaptcha
      });
    },
  });
};
