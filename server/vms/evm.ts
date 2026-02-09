import { BN } from "luxfi";
import Web3 from "web3";
import ERC20Interface from "./ERC20Interface.json";
import EIP7702 from "./eip7702";
import type { ChainType, RequestType, SendTokenResponse } from "./evmTypes";
import Log from "./Log";
import { calculateBaseUnit } from "./utils";

type BatchBufferItem = {
  receiver: string;
  amount: BN | number;
  id?: string;
  key: string;
};

export default class EVM {
  web3: any;
  account: any;
  NAME: string;
  DRIP_AMOUNT: BN;
  DECIMALS: number;
  MAX_BALANCE: BN | null;
  LEGACY: boolean;
  MAX_PRIORITY_FEE: string;
  MAX_FEE: string;
  RECALIBRATE: number;
  hasError: Map<string, string | undefined>;
  hasSuccess: Map<string, string | undefined>;
  balance: any;
  isFetched: boolean;
  isUpdating: boolean;
  recalibrate: boolean;
  waitingForRecalibration: boolean;
  waitArr: any[];
  batchBuffer: BatchBufferItem[];
  isFlushing: boolean;
  error: boolean;
  log: Log;
  contracts: any;
  private eip7702: EIP7702;
  private flushBatchInterval: ReturnType<typeof setInterval> | null = null;
  private readonly batchMaxSize: number;

  constructor(config: ChainType, PK: string | undefined) {
    if (!config.accountImplementation) {
      throw new Error(
        `EVM ${config.NAME}: accountImplementation is required for EIP-7702 batch mode`,
      );
    }
    this.web3 = new Web3(config.RPC);
    const privateKey = PK?.startsWith("0x") ? PK : `0x${PK}`;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.contracts = new Map();
    this.eip7702 = new EIP7702(config, privateKey ?? "");
    this.batchMaxSize = config.eip7702BatchMaxSize ?? 1000;

    this.NAME = config.NAME;
    this.DECIMALS = config.DECIMALS || 18;
    this.DRIP_AMOUNT = calculateBaseUnit(
      config.DRIP_AMOUNT.toString(),
      this.DECIMALS,
    );
    this.MAX_BALANCE = config.MAX_BALANCE
      ? calculateBaseUnit(config.MAX_BALANCE.toString(), this.DECIMALS)
      : null;
    this.MAX_PRIORITY_FEE = config.MAX_PRIORITY_FEE;
    this.MAX_FEE = config.MAX_FEE;
    this.RECALIBRATE = config.RECALIBRATE || 30;
    this.LEGACY = false;

    this.log = new Log(this.NAME);

    this.hasError = new Map();
    this.hasSuccess = new Map();
    this.balance = new BN(0);
    this.batchBuffer = [];
    this.isFlushing = false;

    this.isFetched = false;
    this.isUpdating = false;
    this.recalibrate = false;
    this.waitingForRecalibration = false;
    this.waitArr = [];
    this.error = false;

    this.setupTransactionType();
    this.recalibrateNonceAndBalance();
    this.eip7702
      .ensureAuthorization()
      .catch((err: any) =>
        this.log.error(`EIP7702 ensureAuthorization: ${err?.message ?? err}`),
      );

    this.flushBatchInterval = setInterval(() => {
      this.flushBatch();
    }, 1000);

    setInterval(() => {
      this.recalibrateNonceAndBalance();
    }, this.RECALIBRATE * 1000);
  }

  // Setup Legacy or EIP1559 transaction type
  async setupTransactionType(): Promise<void> {
    try {
      const baseFee = (await this.web3.eth.getBlock("latest")).baseFeePerGas;
      if (baseFee === undefined) {
        this.LEGACY = true;
      }
      this.error = false;
    } catch (err: any) {
      this.error = true;
      this.log.error(err.message);
    }
  }

  // Function to issue transfer transaction. For ERC20 transfers, 'id' will be a string representing ERC20 token ID
  async sendToken(
    receiver: string,
    id: string | undefined,
    cb: (param: SendTokenResponse) => void,
  ): Promise<void> {
    if (this.error) {
      cb({
        status: 400,
        message: "Internal RPC error! Please try after sometime",
      });
      return;
    }

    if (!this.web3.utils.isAddress(receiver)) {
      cb({ status: 400, message: "Invalid address! Please try again." });
      return;
    }

    // Check if receiver already has enough balance
    if (this.MAX_BALANCE) {
      try {
        const receiverBalance = new BN(
          await this.web3.eth.getBalance(receiver),
        );
        if (receiverBalance.gte(this.MAX_BALANCE)) {
          cb({
            status: 400,
            message: `Your balance exceeds the maximum allowed. You already have enough ${this.NAME} tokens.`,
          });
          return;
        }
      } catch (err: any) {
        this.log.error(`Failed to check receiver balance: ${err.message}`);
      }
    }

    let amount: BN = this.DRIP_AMOUNT;

    // If id is provided, then it is ERC20 token transfer, so update the amount
    if (this.contracts.get(id)) {
      const dripAmount: number = this.contracts.get(id).config.DRIP_AMOUNT;
      if (dripAmount) {
        amount = calculateBaseUnit(
          dripAmount.toString(),
          this.contracts.get(id).config.DECIMALS || 18,
        );
      }
    }

    this.processRequest({ receiver, amount, id });

    // After transaction is being processed, wait for success or error
    const waitingForResult = setInterval(async () => {
      const key = receiver + (id || "");

      // Check for error first
      if (this.hasError.get(key) !== undefined) {
        clearInterval(waitingForResult);

        const errorMessage = this.hasError.get(key)!;
        this.hasError.set(key, undefined);

        cb({
          status: 400,
          message: errorMessage,
        });
        return;
      }

      // Check for success
      if (this.hasSuccess.get(key) !== undefined) {
        clearInterval(waitingForResult);

        const txHash = this.hasSuccess.get(key)!;
        this.hasSuccess.set(key, undefined);

        cb({
          status: 200,
          message: `Transaction successful on ${this.NAME}!`,
          txHash,
        });
        return;
      }
    }, 300);
  }

  async processRequest(req: RequestType): Promise<void> {
    if (!this.isFetched || this.recalibrate || this.waitingForRecalibration) {
      this.waitArr.push(req);
      if (!this.isUpdating && !this.waitingForRecalibration) {
        await this.updateNonceAndBalance();
      }
    } else {
      this.putInQueue(req);
    }
  }

  getBalance(id?: string): BN {
    if (id && this.contracts.get(id)) {
      return this.getERC20Balance(id);
    } else {
      return this.balance;
    }
  }

  getERC20Balance(id: string): BN {
    return this.contracts.get(id)?.balance;
  }

  async fetchERC20Balance(): Promise<void> {
    this.contracts.forEach(async (contract: any) => {
      contract.balance = new BN(
        await contract.methods.balanceOf(this.account.address).call(),
      );
    });
  }

  async updateNonceAndBalance(): Promise<void> {
    this.isUpdating = true;
    try {
      this.balance = new BN(
        await this.web3.eth.getBalance(this.account.address),
      );
      await this.fetchERC20Balance();

      this.error && this.log.info("RPC server recovered!");
      this.error = false;

      this.isFetched = true;
      this.isUpdating = false;
      this.recalibrate = false;

      while (this.waitArr.length !== 0) {
        this.putInQueue(this.waitArr.shift());
      }
    } catch (err: any) {
      this.isUpdating = false;
      this.error = true;
      this.log.error(err.message);
    }
  }

  balanceCheck(req: RequestType): Boolean {
    const _balance: BN = this.getBalance(req.id);
    if (req.id && this.contracts.get(req.id)) {
      if (this.contracts.get(req.id).balance.gt(req.amount)) {
        this.contracts.get(req.id).balance = this.contracts
          .get(req.id)
          .balance.sub(req.amount);
        return true;
      }
    } else {
      if (this.balance.gt(req.amount)) {
        this.balance = this.balance.sub(req.amount);
        return true;
      }
    }
    return false;
  }

  async putInQueue(req: RequestType): Promise<void> {
    const key = req.receiver + (req.id ?? "");
    if (this.balanceCheck(req)) {
      this.batchBuffer.push({
        receiver: req.receiver,
        amount: req.amount,
        id: req.id,
        key,
      });
    } else {
      this.log.warn(`Faucet balance too low!${this.balance}`);
      this.hasError.set(
        key,
        "Faucet balance too low! Please try after sometime.",
      );
    }
  }

  async flushBatch(): Promise<void> {
    if (
      !this.eip7702.hasAuthorization() ||
      this.batchBuffer.length === 0 ||
      this.isFlushing
    ) {
      return;
    }
    this.isFlushing = true;
    const take = Math.min(this.batchBuffer.length, this.batchMaxSize);
    const batch = this.batchBuffer.splice(0, take);
    const calls = batch.map((item) => {
      if (!item.id || !this.contracts.get(item.id)) {
        const value =
          typeof item.amount === "number"
            ? BigInt(item.amount)
            : BigInt((item.amount as BN).toString());
        return {
          target: item.receiver,
          value,
          data: "0x" as `0x${string}`,
        };
      }
      const contract = this.contracts.get(item.id);
      const data = contract.methods
        .transfer(item.receiver, item.amount)
        .encodeABI() as `0x${string}`;
      return {
        target: contract.config.CONTRACTADDRESS as string,
        value: BigInt(0),
        data,
      };
    });
    try {
      this.log.info(`Sent batch of ${batch.length} txs,`);
      const txHash = await this.eip7702.sendBatchWithAuth(calls);
      this.log.info(`txHash: ${txHash}`);
      for (const item of batch) {
        this.hasSuccess.set(item.key, txHash);
      }
    } catch (err: any) {
      const raw = err?.message ?? String(err);
      const firstLine = raw.split(/\n/)[0]?.trim() ?? raw;
      const shortMessage =
        firstLine.length > 280 ? `${firstLine.slice(0, 280)}…` : firstLine;
      this.log.error(`flushBatch (batch=${batch.length}): ${shortMessage}`);
      const userMessage =
        firstLine.length > 200 ? `${firstLine.slice(0, 200)}…` : firstLine;
      for (const item of batch) {
        this.hasError.set(
          item.key,
          `Transaction failed on ${this.NAME}: ${userMessage}. Please try again.`,
        );
      }
    } finally {
      this.isFlushing = false;
    }
  }

  async recalibrateNonceAndBalance(): Promise<void> {
    this.waitingForRecalibration = true;

    if (!this.isFlushing && !this.isUpdating) {
      this.isFetched = false;
      this.waitingForRecalibration = false;
      this.updateNonceAndBalance();
    } else {
      const recalibrateNow = setInterval(() => {
        if (!this.isFlushing && !this.isUpdating) {
          clearInterval(recalibrateNow);
          this.waitingForRecalibration = false;
          this.recalibrateNonceAndBalance();
        }
      }, 300);
    }
  }

  async addERC20Contract(config: any) {
    this.contracts.set(config.ID, {
      methods: new this.web3.eth.Contract(
        ERC20Interface,
        config.CONTRACTADDRESS,
      ).methods,
      balance: 0,
      config,
    });
  }
}
