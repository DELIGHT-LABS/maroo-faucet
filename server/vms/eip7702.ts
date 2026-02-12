import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  type Hash,
  type Hex,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ChainType } from "./evmTypes";

const accountAbi = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "uint256", name: "value", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
        ],
        internalType: "struct Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "executeBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export type BatchCall = {
  target: string;
  value: bigint;
  data: Hex;
};

export default class EIP7702 {
  private readonly chain: {
    id: number;
    name: string;
    nativeCurrency: { name: string; symbol: string; decimals: number };
    rpcUrls: { default: { http: string[] } };
  };
  private readonly publicClient: ReturnType<typeof createPublicClient>;
  private readonly walletClient: ReturnType<typeof createWalletClient>;
  private readonly account: ReturnType<typeof privateKeyToAccount>;
  private readonly contractAddress: `0x${string}`;
  private nextNonce: number | null = null;

  constructor(config: ChainType, privateKey: string) {
    const pk = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    this.chain = {
      id: config.CHAINID,
      name: config.NAME,
      nativeCurrency: {
        name: config.TOKEN,
        symbol: config.TOKEN,
        decimals: 18,
      },
      rpcUrls: { default: { http: [config.RPC] } },
    } as const;
    this.account = privateKeyToAccount(pk as `0x${string}`);
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(config.RPC),
    });
    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(config.RPC),
    });
    this.contractAddress = config.accountImplementation as `0x${string}`;
  }

  hasAuthorization(): boolean {
    return this.nextNonce != null;
  }

  async ensureAuthorization(): Promise<void> {
    if (this.nextNonce != null) return;
    this.nextNonce = await this.publicClient.getTransactionCount({
      address: this.account.address,
      blockTag: "pending",
    });
  }

  async sendBatchWithAuth(calls: BatchCall[]): Promise<Hash> {
    const nonce =
      this.nextNonce ??
      (await this.publicClient.getTransactionCount({
        address: this.account.address,
        blockTag: "pending",
      }));
    this.nextNonce = nonce + 1;

    const auth = await (this.walletClient as any).signAuthorization({
      account: this.account,
      contractAddress: this.contractAddress,
      executor: "self",
      nonce,
    });

    const data = encodeFunctionData({
      abi: accountAbi,
      functionName: "executeBatch",
      args: [
        calls.map((c) => ({
          target: c.target as `0x${string}`,
          value: c.value,
          data: c.data,
        })),
      ],
    });

    const hash = await this.walletClient.sendTransaction({
      account: this.account,
      chain: this.chain,
      authorizationList: [auth as any],
      data,
      to: this.account.address,
      nonce,
    });
    return hash;
  }

  getAddress(): `0x${string}` {
    return this.account.address;
  }
}
