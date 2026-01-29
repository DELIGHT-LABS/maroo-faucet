export const API_URL: string =
  import.meta.env.WAKU_PUBLIC_API_URL || "http://localhost:8000";
export const TESTNET_RPC: string =
  import.meta.env.WAKU_PUBLIC_MAROO_TESTNET_RPC ||
  "https://api.maroo-pretestnet.delightlabs.sh/";
export const RECAPTCHA_SITE_KEY: string =
  import.meta.env.WAKU_PUBLIC_RECAPTCHA_SITE_KEY || "";
export const WC_PROJECT_ID: string =
  import.meta.env.WAKU_PUBLIC_WC_PROJECT_ID || "";
