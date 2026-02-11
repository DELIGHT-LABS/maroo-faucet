import type { BN } from "luxfi";

export type ChainType = {
  ID: string;
  NAME: string;
  TOKEN: string;
  RPC: string;
  CHAINID: number;
  EXPLORER: string;
  IMAGE: string;
  MAX_PRIORITY_FEE: string;
  MAX_FEE: string;
  DECIMALS?: number;
  DRIP_AMOUNT: number;
  MAX_BALANCE?: number;
  RECALIBRATE?: number;
  accountImplementation: string;
  eip7702BatchMaxSize?: number;
  RATELIMIT: {
    WINDOW_SIZE: number;
    MAX_LIMIT: number;
  };
};
export type SendTokenResponse = {
  status: number;
  message: string;
  txHash?: string;
};

export type RequestType = {
  receiver: string;
  amount: BN | number;
  id?: string;
};
