import { useQuery } from "@tanstack/react-query";

import { kycApi } from "~/shared/api/kyc-api";

export const useSession = () => {
  return useQuery({
    queryKey: ["siwe-session"],
    queryFn: async () => {
      try {
        const { data } = await kycApi.api.authControllerSession();
        return data;
      } catch {
        // silently fail
        return null;
      }
    },
    retry: false,
  });
};
