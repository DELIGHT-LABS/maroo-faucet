import { API_URL } from "~/shared/lib/env";

import { Api } from "./generated";

export const kycApi = new Api({
  baseUrl: API_URL,
  baseApiParams: {
    credentials: "include",
  },
});
