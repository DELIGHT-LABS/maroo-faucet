import { BN } from "luxfi";
import Web3 from "web3";
import ERC20Interface from "./ERC20Interface.json";
import type { ChainType, RequestType, SendTokenResponse } from "./evmTypes";
import Log from "./Log";
import { calculateBaseUnit } from "./utils";
import NonceManager, { type SignedTx } from "./NonceManager";
import SignedTxQueue from "./SignedTxQueue";
import BroadcastScheduler, { type BroadcastCallbacks } from "./BroadcastScheduler";
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
  hasNonce: Map<string, number | undefined>;
  pendingTxNonces: Set<unknown>;
  hasError: Map<string, string | undefined>;
  hasSuccess: Map<string, string | undefined>;
  nonce: number;
  balance: any;
  isFetched: boolean;
  isUpdating: boolean;
  recalibrate: boolean;
  waitingForRecalibration: boolean;
  waitArr: any[];
  queue: any[];
  error: boolean;
  isProcessingQueue: boolean;
  log: Log;
  contracts: any;
  // 새로운 큐 시스템 필드
  nonceManager: NonceManager;
  signedTxQueue: SignedTxQueue;
  broadcastScheduler: BroadcastScheduler | null;
  signingPromises: Map<string, Promise<{ nonce: number; signedTx: SignedTx }>>;
  requestCallbacks: Map<string, { cb: (param: SendTokenResponse) => void; timeout: NodeJS.Timeout }>;
  pendingSignRequests: RequestType[];
  failedRequests: Map<string, RequestType>; // 실패한 요청 저장 (재시도용)

  constructor(config: ChainType, PK: string | undefined) {
    this.web3 = new Web3(config.RPC);
    // Ensure private key has 0x prefix for web3
    const privateKey = PK?.startsWith("0x") ? PK : `0x${PK}`;
    this.account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
    this.contracts = new Map();

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

    this.hasNonce = new Map();
    this.hasError = new Map();
    this.hasSuccess = new Map();
    this.pendingTxNonces = new Set();

    this.nonce = -1;
    this.balance = new BN(0);

    this.isFetched = false;
    this.isUpdating = false;
    this.recalibrate = false;
    this.waitingForRecalibration = false;

    this.waitArr = [];
    this.queue = [];

    this.error = false;
    this.isProcessingQueue = false;

    // 새로운 큐 시스템 초기화
    this.nonceManager = new NonceManager();
    this.signedTxQueue = new SignedTxQueue();
    this.broadcastScheduler = null;
    this.signingPromises = new Map();
    this.requestCallbacks = new Map();
    this.pendingSignRequests = [];
    this.failedRequests = new Map();

    this.setupTransactionType();
    this.initializeNonceManager();
    // recalibrateNonceAndBalance 제거 - NonceManager와 BroadcastScheduler의 에러 복구 로직으로 대체됨
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
    const requestStartTime = Date.now();
    const key = receiver + (id || "");

    this.log.info(`[REQUEST_START] receiver=${receiver.substring(0, 10)}... key=${key.substring(0, 20)}...`);

    if (this.error) {
      this.log.error(`[REQUEST_ERROR] key=${key.substring(0, 20)}... RPC error`);
      cb({
        status: 400,
        message: "Internal RPC error! Please try after sometime",
      });
      return;
    }

    // 에러 처리 중에는 새 요청 거부 (에러 복구 후 재시도 요청)
    if (this.broadcastScheduler?.isHandlingBroadcastError()) {
      this.log.warn(`[REQUEST_REJECT] key=${key.substring(0, 20)}... Error recovery in progress`);
      cb({
        status: 503,
        message: "Service temporarily unavailable due to error recovery. Please try again.",
      });
      return;
    }

    if (!this.web3.utils.isAddress(receiver)) {
      this.log.error(`[REQUEST_ERROR] key=${key.substring(0, 20)}... Invalid address`);
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
          this.log.warn(`[REQUEST_REJECT] key=${key.substring(0, 20)}... Balance too high`);
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

    const req: RequestType = { receiver, amount, id };

    // 60초 타임아웃 설정 (에러 처리 + gap filling 시간 고려)
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - requestStartTime;
      const callbackData = this.requestCallbacks.get(key);
      if (callbackData) {
        const queueMinNonce = this.signedTxQueue.getMinNonce();
        const requiredNonce = this.nonceManager.getNextNonce();
        const queueSize = this.signedTxQueue.size();
        const signingPromisesSize = this.signingPromises.size;
        this.log.warn(`[TIMEOUT] key=${key.substring(0, 20)}... elapsed=${elapsed}ms queueSize=${queueSize} signingPromises=${signingPromisesSize} requiredNonce=${requiredNonce} queueMinNonce=${queueMinNonce}`);
        this.requestCallbacks.delete(key);
        callbackData.cb({
          status: 408,
          message: `Request timeout on ${this.NAME}. Please try again.`,
        });
      }
    }, 20 * 1000);

    // 콜백과 타임아웃 저장
    this.requestCallbacks.set(key, { cb, timeout });

    // 요청 처리 시작
    this.processRequest(req);
  }

  async processRequest(req: RequestType): Promise<void> {
    const key = req.receiver + (req.id || "");
    if (!this.isFetched || this.recalibrate || this.waitingForRecalibration) {
      this.log.warn(`[PROCESS_WAIT] key=${key.substring(0, 20)}... isFetched=${this.isFetched} recalibrate=${this.recalibrate} waitingForRecalibration=${this.waitingForRecalibration}`);
      this.waitArr.push(req);
      if (!this.isUpdating && !this.waitingForRecalibration) {
        await this.updateNonceAndBalance();
      }
    } else {
      // 병렬 서명 시작
      this.signTransactionAsync(req);
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

  async initializeNonceManager(): Promise<void> {
    try {
      await this.nonceManager.initialize(this.web3, this.account.address);
      this.setupBroadcastScheduler();
    } catch (err: any) {
      this.error = true;
      this.log.error(`Failed to initialize nonce manager: ${err.message}`);
    }
  }

  setupBroadcastScheduler(): void {
    if (this.broadcastScheduler) {
      return; // 이미 설정됨
    }

    const callbacks: BroadcastCallbacks = {
      onSuccess: (nonce, txHash, receiver, id) => {
        this.handleBroadcastSuccess(nonce, txHash, receiver, id);
      },
      onError: (nonce, error, receiver, id) => {
        this.handleBroadcastError(nonce, error, receiver, id);
      },
      onGapFill: (nonce, signedTx) => {
        this.handleGapFill(nonce, signedTx);
      },
      onLog: (message) => {
        this.log.info(message);
      },
    };

    this.broadcastScheduler = new BroadcastScheduler(
      this.web3,
      this.account.address,
      this.nonceManager,
      this.signedTxQueue,
      callbacks,
    );

    this.broadcastScheduler.start();
  }

  async signTransactionAsync(req: RequestType): Promise<void> {
    const key = req.receiver + (req.id || "");
    const startTime = Date.now();

    this.log.info(`[SIGN_START] receiver=${req.receiver.substring(0, 10)}... key=${key.substring(0, 20)}...`);

    // 잔액 체크
    if (!this.balanceCheck(req)) {
      this.log.warn(`Faucet balance too low!${this.balance}`);
      const callbackData = this.requestCallbacks.get(key);
      if (callbackData) {
        clearTimeout(callbackData.timeout);
        this.requestCallbacks.delete(key);
        callbackData.cb({
          status: 400,
          message: "Faucet balance too low! Please try after sometime.",
        });
      }
      return;
    }

    // 실패한 요청 정보 저장 (재시도용)
    this.failedRequests.set(key, req);

    // nonce 할당
    const nonce = this.nonceManager.allocateNonce();
    const requiredNonce = this.nonceManager.getNextNonce();
    this.log.info(`[NONCE_ALLOC] key=${key.substring(0, 20)}... allocatedNonce=${nonce} requiredNonce=${requiredNonce} queueSize=${this.signedTxQueue.size()}`);

    // 병렬 서명 시작
    const signPromise = this.getTransaction(
      req.receiver,
      req.amount,
      nonce,
      req.id,
    )
      .then(({ rawTransaction, txHash }) => {
        const signTime = Date.now() - startTime;
        this.log.info(`[SIGN_SUCCESS] key=${key.substring(0, 20)}... nonce=${nonce} txHash=${txHash.substring(0, 10)}... signTime=${signTime}ms`);
        const signedTx: SignedTx = {
          rawTransaction,
          txHash,
          receiver: req.receiver,
          amount: req.amount,
          id: req.id,
        };
        return { nonce, signedTx };
      })
      .catch((err: any) => {
        const signTime = Date.now() - startTime;
        this.log.error(`[SIGN_FAIL] key=${key.substring(0, 20)}... nonce=${nonce} error=${err.message} signTime=${signTime}ms`);
        throw err;
      });

    this.signingPromises.set(key, signPromise);

    signPromise
      .then(({ nonce: assignedNonce, signedTx }) => {
        this.signingPromises.delete(key);
        // 서명 완료 후 큐에 추가
        this.signedTxQueue.add(assignedNonce, signedTx);
        const queueMinNonce = this.signedTxQueue.getMinNonce();
        const currentRequiredNonce = this.nonceManager.getNextNonce();
        this.log.info(`[QUEUE_ADD] key=${key.substring(0, 20)}... nonce=${assignedNonce} queueMinNonce=${queueMinNonce} requiredNonce=${currentRequiredNonce} queueSize=${this.signedTxQueue.size()}`);
        // 큐에 추가되었으므로 즉시 브로드캐스트 시도
        if (this.broadcastScheduler) {
          this.broadcastScheduler.tryBroadcast();
        }
      })
      .catch((err: any) => {
        this.signingPromises.delete(key);
        this.log.error(`[SIGN_ERROR] key=${key.substring(0, 20)}... nonce=${nonce} error=${err.message}`);
        const callbackData = this.requestCallbacks.get(key);
        if (callbackData) {
          clearTimeout(callbackData.timeout);
          this.requestCallbacks.delete(key);
          callbackData.cb({
            status: 400,
            message: `Failed to create transaction on ${this.NAME}. Please try again.`,
          });
        }
      });
  }

  handleBroadcastSuccess(
    nonce: number,
    txHash: string,
    receiver: string,
    id?: string,
  ): void {
    const key = receiver + (id || "");
    const callbackData = this.requestCallbacks.get(key);
    if (callbackData) {
      clearTimeout(callbackData.timeout);
      this.requestCallbacks.delete(key);
      this.failedRequests.delete(key); // 성공 시 실패 요청 정보 제거
      this.log.info(`[BROADCAST_SUCCESS] key=${key.substring(0, 20)}... nonce=${nonce} txHash=${txHash.substring(0, 10)}... queueSize=${this.signedTxQueue.size()} requiredNonce=${this.nonceManager.getNextNonce()}`);
      try {
        callbackData.cb({
          status: 200,
          message: `Transaction successful on ${this.NAME}!`,
          txHash,
        });
        this.log.info(`[BROADCAST_SUCCESS_CALLBACK_SENT] key=${key.substring(0, 20)}... nonce=${nonce}`);
      } catch (err: any) {
        this.log.error(`[BROADCAST_SUCCESS_CALLBACK_ERROR] key=${key.substring(0, 20)}... nonce=${nonce} error=${err.message}`);
      }
    } else {
      this.log.warn(`[BROADCAST_SUCCESS_NO_CALLBACK] key=${key.substring(0, 20)}... nonce=${nonce} txHash=${txHash.substring(0, 10)}...`);
    }
  }

  async handleBroadcastError(
    nonce: number,
    error: any,
    receiver: string,
    id?: string,
  ): Promise<void> {
    const key = receiver + (id || "");
    const errorMessage =
      error?.message || "Unknown error occurred during transaction broadcast.";

    this.log.error(`[BROADCAST_ERROR] key=${key.substring(0, 20)}... nonce=${nonce} error=${errorMessage} queueSize=${this.signedTxQueue.size()} requiredNonce=${this.nonceManager.getNextNonce()}`);

    // 실패한 요청 정보 가져오기
    const failedReq = this.failedRequests.get(key);

    // 실패한 tx 재시도: 새로운 nonce로 다시 sign
    if (failedReq) {
      // 원래 요청 정보로 재시도
      this.log.info(`[RETRY] key=${key.substring(0, 20)}... receiver=${receiver.substring(0, 10)}... retrying with new nonce`);
      // 잔액 체크는 이미 했으므로, 바로 재시도
      await this.signTransactionAsync(failedReq);
    } else {
      // 요청 정보가 없으면 에러 반환
      this.log.warn(`[BROADCAST_ERROR_NO_RETRY] key=${key.substring(0, 20)}... no failed request found`);
      const callbackData = this.requestCallbacks.get(key);
      if (callbackData) {
        clearTimeout(callbackData.timeout);
        this.requestCallbacks.delete(key);
        this.failedRequests.delete(key);
        callbackData.cb({
          status: 400,
          message: `Transaction failed on ${this.NAME}: ${errorMessage}. Please try again.`,
        });
      }
    }
  }

  async handleGapFill(nonce: number, signedTx: SignedTx): Promise<void> {
    // 큐의 마지막 트랜잭션을 제거하고 다시 서명 요청
    // signedTx는 이미 제거된 트랜잭션이므로, 이를 사용하여 새로운 nonce로 서명
    this.log.info(`[GAP_FILL] nonce=${nonce} receiver=${signedTx.receiver.substring(0, 10)}... re-signing`);
    
    try {
      const { rawTransaction, txHash } = await this.getTransaction(
        signedTx.receiver,
        signedTx.amount,
        nonce,
        signedTx.id,
      );
      const newSignedTx: SignedTx = {
        rawTransaction,
        txHash,
        receiver: signedTx.receiver,
        amount: signedTx.amount,
        id: signedTx.id,
      };
      
      // 큐에 추가
      this.signedTxQueue.add(nonce, newSignedTx);
      this.log.info(`[GAP_FILL_SUCCESS] nonce=${nonce} txHash=${txHash.substring(0, 10)}... queueSize=${this.signedTxQueue.size()}`);
      
      // 큐에 추가되었으므로 즉시 브로드캐스트 시도
      if (this.broadcastScheduler) {
        this.broadcastScheduler.tryBroadcast();
      }
    } catch (err: any) {
      this.log.error(`[GAP_FILL_ERROR] nonce=${nonce} error=${err.message}`);
    }
  }

  async updateNonceAndBalance(): Promise<void> {
    this.isUpdating = true;
    try {
      [this.nonce, this.balance] = await Promise.all([
        this.web3.eth.getTransactionCount(this.account.address, "latest"),
        this.web3.eth.getBalance(this.account.address),
      ]);

      await this.fetchERC20Balance();

      this.balance = new BN(this.balance);

      this.error && this.log.info("RPC server recovered!");
      this.error = false;

      this.isFetched = true;
      this.isUpdating = false;
      this.recalibrate = false;

      // nonceManager 업데이트
      await this.nonceManager.initialize(this.web3, this.account.address);

      while (this.waitArr.length !== 0) {
        const req = this.waitArr.shift();
        if (req) {
          this.signTransactionAsync(req);
        }
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


  async getTransaction(
    to: string,
    value: BN | number,
    nonce: number | undefined,
    id?: string,
  ): Promise<any> {
    const tx: any = {
      type: 2,
      gas: "21000",
      nonce,
      to,
      maxPriorityFeePerGas: this.MAX_PRIORITY_FEE,
      maxFeePerGas: this.MAX_FEE,
      value,
    };

    if (this.LEGACY) {
      delete tx.maxPriorityFeePerGas;
      delete tx.maxFeePerGas;
      tx.gasPrice = await this.getAdjustedGasPrice();
      tx.type = 0;
    }

    if (this.contracts.get(id)) {
      const txObject = this.contracts.get(id)?.methods.transfer(to, value);
      tx.data = txObject.encodeABI();
      tx.value = 0;
      tx.to = this.contracts.get(id)?.config.CONTRACTADDRESS;
      tx.gas = this.contracts.get(id)?.config.GASLIMIT;
    }

    let signedTx;
    try {
      signedTx = await this.account.signTransaction(tx);
    } catch (err: any) {
      this.error = true;
      this.log.error(err.message);
    }
    const txHash = signedTx?.transactionHash;
    const rawTransaction = signedTx?.rawTransaction;

    return { txHash, rawTransaction };
  }

  async getGasPrice(): Promise<number> {
    return this.web3.eth.getGasPrice();
  }

  async getAdjustedGasPrice(): Promise<number> {
    try {
      const gasPrice: number = await this.getGasPrice();
      const adjustedGas: number = Math.floor(gasPrice * 1.25);
      return Math.min(adjustedGas, parseInt(this.MAX_FEE, 10));
    } catch (err: any) {
      this.error = true;
      this.log.error(err.message);
      return 0;
    }
  }

  async recalibrateNonceAndBalance(): Promise<void> {
    this.waitingForRecalibration = true;

    // 큐가 비어있고 업데이트 중이 아닐 때만 재보정
    if (
      this.signedTxQueue.size() === 0 &&
      this.isUpdating === false &&
      !this.broadcastScheduler?.isActive()
    ) {
      this.isFetched = false;
      this.recalibrate = true;
      this.waitingForRecalibration = false;

      // nonceManager 재초기화
      await this.nonceManager.initialize(this.web3, this.account.address);
      this.updateNonceAndBalance();
    } else {
      const recalibrateNow = setInterval(() => {
        if (
          this.signedTxQueue.size() === 0 &&
          this.isUpdating === false &&
          !this.broadcastScheduler?.isActive()
        ) {
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
