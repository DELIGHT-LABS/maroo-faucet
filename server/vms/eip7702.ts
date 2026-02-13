import {
  type Address,
  createPublicClient,
  createWalletClient,
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
  target: Address;
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

  async ensureAuthorization(): Promise<void> {
    if (this.nextNonce != null) return;
    this.nextNonce = await this.publicClient.getTransactionCount({
      address: this.account.address,
      blockTag: "pending",
    });
  }

  hasAuthorization(): boolean {
    return this.nextNonce != null;
  }

  async sendBatchWithAuth(calls: BatchCall[]): Promise<Hash> {
    const txNonce = this.nextNonce!;
    const authNonce = txNonce + 1;
    // Reserve 2 nonces: one for the tx itself, one for the EIP-7702 authorization.
    // When executor === "self", the tx nonce is consumed before the auth nonce is
    // validated, so authNonce must be txNonce + 1.
    this.nextNonce = txNonce + 2;

    const auth = await this.walletClient.signAuthorization({
      account: this.account,
      contractAddress: this.contractAddress,
      executor: "self",
      nonce: authNonce,
    });

    try {
      // Simulate first to catch revert reasons without consuming the nonce on-chain.
      const { request } = await this.publicClient.simulateContract({
        account: this.account,
        chain: this.chain,
        abi: accountAbi,
        functionName: "executeBatch",
        args: [calls],
        address: this.account.address,
        authorizationList: [auth],
        nonce: txNonce,
      });

      const hash = await this.walletClient.writeContract(request);
      return hash;
    } catch (e) {
      // On failure, resync nonce from the network to avoid permanent desync.
      this.nextNonce = await this.publicClient.getTransactionCount({
        address: this.account.address,
        blockTag: "pending",
      });
      throw e;
    }
  }

  getAddress(): `0x${string}` {
    return this.account.address;
  }
}
