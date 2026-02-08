import type { SignedTx } from "./NonceManager";
import NonceManager from "./NonceManager";
import SignedTxQueue from "./SignedTxQueue";

export type BroadcastCallbacks = {
  onSuccess: (nonce: number, txHash: string, receiver: string, id?: string) => void;
  onError: (nonce: number, error: any, receiver: string, id?: string) => void;
  onGapFill: (nonce: number, signedTx: SignedTx) => void;
  onLog?: (message: string) => void;
};

export default class BroadcastScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isStopped: boolean = false;
  private web3: any;
  private address: string;
  private nonceManager: NonceManager;
  private signedTxQueue: SignedTxQueue;
  private callbacks: BroadcastCallbacks;
  private broadcastingNonces: Set<number> = new Set(); // 전송 중인 nonce 추적
  private isHandlingError: boolean = false; // 에러 처리 중 플래그
  private lastBroadcastTime: number = 0; // 마지막 브로드캐스트 시간 (ms)
  private minBroadcastInterval: number = 50; // 최소 브로드캐스트 간격 (ms)

  constructor(
    web3: any,
    address: string,
    nonceManager: NonceManager,
    signedTxQueue: SignedTxQueue,
    callbacks: BroadcastCallbacks,
  ) {
    this.web3 = web3;
    this.address = address;
    this.nonceManager = nonceManager;
    this.signedTxQueue = signedTxQueue;
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.intervalId !== null) {
      return; // 이미 시작됨
    }
    this.isStopped = false;
    this.intervalId = setInterval(() => {
      this.broadcastNext();
    }, 50); // 30ms 간격
  }

  stop(): void {
    this.isStopped = true;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async broadcastNext(): Promise<void> {
    if (this.isStopped) {
      return;
    }

    // 에러 처리 중에는 브로드캐스트 스킵
    if (this.isHandlingError) {
      return;
    }

    // 마지막 브로드캐스트로부터 최소 간격이 지나지 않았으면 건너뜀
    const now = Date.now();
    const timeSinceLastBroadcast = now - this.lastBroadcastTime;
    if (this.lastBroadcastTime > 0 && timeSinceLastBroadcast < this.minBroadcastInterval) {
      return;
    }

    const queueMinNonce = this.signedTxQueue.getMinNonce();
    const requiredNonce = this.nonceManager.getNextNonce();

    // 큐가 비어있으면 브로드캐스트 불가
    if (queueMinNonce === null) {
      return;
    }

    // 브로드캐스트 가능 조건: queueMinNonce <= requiredNonce
    // 브로드캐스트 성공 시 markSent를 호출하므로, requiredNonce는 마지막 성공 nonce + 1
    // queueMinNonce가 requiredNonce와 같거나 작으면 브로드캐스트 가능
    if (queueMinNonce > requiredNonce) {
      return;
    }

    // queueMinNonce를 브로드캐스트
    const broadcastNonce = queueMinNonce;
    const tx = this.signedTxQueue.get(broadcastNonce);
    if (!tx) {
      this.callbacks.onLog?.(
        `[BROADCAST_ERROR] nonce=${requiredNonce} tx not found in queue queueSize=${this.signedTxQueue.size()}`,
      );
      return;
    }

    // 이미 전송 중인 nonce는 스킵 (중복 방지)
    if (this.broadcastingNonces.has(broadcastNonce)) {
      return;
    }

    // 전송 중 플래그 설정 및 큐에서 제거 (중복 전송 방지)
    this.broadcastingNonces.add(broadcastNonce);
    this.signedTxQueue.remove(broadcastNonce);

    // 브로드캐스트 시간 업데이트
    this.lastBroadcastTime = now;
    this.callbacks.onLog?.(
      `[BROADCAST_START] nonce=${broadcastNonce} txHash=${tx.txHash.substring(0, 10)}... receiver=${tx.receiver.substring(0, 10)}... queueSize=${this.signedTxQueue.size()} requiredNonce=${this.nonceManager.getNextNonce()} queueMinNonce=${queueMinNonce} timestamp=${now}`,
    );

    // txpool에 전송하는 순간 nonce 증가 (다음 tx를 100ms 후 바로 보낼 수 있도록)
    this.nonceManager.markSent(broadcastNonce);

    // 비동기로 전송 (await하지 않음 - 100ms 간격으로 계속 진행)
    this.web3.eth
      .sendSignedTransaction(tx.rawTransaction)
      .then(() => {
        // 성공 시 전송 중 플래그 제거
        this.broadcastingNonces.delete(broadcastNonce);
        // 성공 시 콜백 호출
        this.callbacks.onLog?.(
          `[BROADCAST_SENT] nonce=${broadcastNonce} txHash=${tx.txHash.substring(0, 10)}... nextRequiredNonce=${this.nonceManager.getNextNonce()}`,
        );
        this.callbacks.onSuccess(broadcastNonce, tx.txHash, tx.receiver, tx.id);
      })
      .catch((error: any) => {
        // 전송 중 플래그 제거
        this.broadcastingNonces.delete(broadcastNonce);
        
        const errorMessage = error?.message || "";
        
        // "tx nonce is lower than account nonce" 에러는 이미 성공한 nonce이므로 성공으로 처리
        if (errorMessage.includes("tx nonce is lower than account nonce")) {
          this.callbacks.onLog?.(
            `[BROADCAST_ALREADY_PROCESSED] nonce=${broadcastNonce} txHash=${tx.txHash.substring(0, 10)}... treating as success (already processed)`,
          );
          this.callbacks.onSuccess(broadcastNonce, tx.txHash, tx.receiver, tx.id);
          return;
        }
        
        // "tx already in mempool" 에러는 이미 전송된 트랜잭션이므로 성공으로 처리
        if (errorMessage.includes("already in mempool") || errorMessage.includes("tx already in mempool")) {
          this.callbacks.onLog?.(
            `[BROADCAST_ALREADY_IN_MEMPOOL] nonce=${broadcastNonce} txHash=${tx.txHash.substring(0, 10)}... treating as success`,
          );
          this.callbacks.onSuccess(broadcastNonce, tx.txHash, tx.receiver, tx.id);
          return;
        }
        
        // 에러 발생 시 처리 (큐에는 그대로 유지하여 재시도 가능하도록)
        this.callbacks.onLog?.(
          `[BROADCAST_SEND_ERROR] nonce=${broadcastNonce} error=${errorMessage}`,
        );
        this.handleError(error, broadcastNonce, tx);
      });
  }

  // 큐에 트랜잭션이 추가될 때 호출하여 즉시 브로드캐스트 시도
  tryBroadcast(): void {
    const queueMinNonce = this.signedTxQueue.getMinNonce();
    const requiredNonce = this.nonceManager.getNextNonce();
    this.callbacks.onLog?.(
      `[TRY_BROADCAST] queueMinNonce=${queueMinNonce} requiredNonce=${requiredNonce} queueSize=${this.signedTxQueue.size()}`,
    );
    // 다음 이벤트 루프에서 브로드캐스트 시도
    setImmediate(() => {
      this.broadcastNext();
    });
  }

  private async handleError(
    error: any,
    failedNonce: number,
    failedTx: SignedTx,
  ): Promise<void> {
    // 이미 에러 처리 중이면 스킵 (여러 에러가 동시에 발생할 수 있음)
    if (this.isHandlingError) {
      this.callbacks.onLog?.(
        `[BROADCAST_SKIP_ERROR] nonce=${failedNonce} already handling error`,
      );
      return;
    }
    
    this.isHandlingError = true;
    this.callbacks.onLog?.(
      `[BROADCAST_HANDLE_ERROR] nonce=${failedNonce} error=${error?.message || "unknown"} queueSize=${this.signedTxQueue.size()}`,
    );
    // 브로드캐스트 중단하지 않음 (stop 호출 안함)
    // 대신 isHandlingError 플래그로 브로드캐스트만 일시 중지

    // 에러 콜백 호출
    this.callbacks.onError(failedNonce, error, failedTx.receiver, failedTx.id);

    // 1초 대기 (진행 중인 다른 브로드캐스트가 완료될 시간을 줌)
    this.callbacks.onLog?.(
      `[BROADCAST_WAIT] waiting 1s before nonce reset...`,
    );
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 블록체인에서 requiredNonce 재조회
    const oldRequiredNonce = this.nonceManager.getNextNonce();
    await this.nonceManager.resetOnError(this.web3, this.address);
    const newRequiredNonce = this.nonceManager.getNextNonce();
    this.callbacks.onLog?.(
      `[BROADCAST_RESET_NONCE] oldRequiredNonce=${oldRequiredNonce} newRequiredNonce=${newRequiredNonce} failedNonce=${failedNonce}`,
    );

    // 큐에서 requiredNonce보다 낮은 모든 nonce 제거 (이미 성공했거나 실패한 것들)
    const allNonces = this.signedTxQueue.getAllNonces();
    let removedCount = 0;
    for (const nonce of allNonces) {
      if (nonce < newRequiredNonce) {
        this.signedTxQueue.remove(nonce);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      this.callbacks.onLog?.(
        `[BROADCAST_CLEANUP] removed ${removedCount} old nonces < requiredNonce=${newRequiredNonce}`,
      );
    }
    
    // allocatedNonce를 requiredNonce로 재설정하여 gap을 채울 수 있도록 함
    // 큐에 더 높은 nonce가 있어도, 새로운 요청은 requiredNonce부터 시작하여 gap을 채움
    const newRequiredNonceAfterCleanup = this.nonceManager.getNextNonce();
    this.nonceManager.updateAllocatedNonceFromQueue(newRequiredNonceAfterCleanup - 1);
    this.callbacks.onLog?.(
      `[BROADCAST_UPDATE_ALLOCATED] allocatedNonce reset to requiredNonce=${newRequiredNonceAfterCleanup} to fill gaps`,
    );
    
    // 큐의 최소 nonce와 requiredNonce 비교
    const queueMinNonce = this.signedTxQueue.getMinNonce();
    const requiredNonce = this.nonceManager.getNextNonce();

    if (queueMinNonce !== null && queueMinNonce !== requiredNonce) {
      // 큐의 최소 nonce와 requiredNonce가 다르면, 큐의 마지막 트랜잭션(최대 nonce)을 제거하고 다시 서명 요청
      // 예: requiredNonce=5, 큐에 7,8,9,10,11이 있으면 11을 제거하고 nonce 5로 다시 서명
      this.callbacks.onLog?.(
        `[BROADCAST_QUEUE_MISMATCH] queueMinNonce=${queueMinNonce} requiredNonce=${requiredNonce} removing last tx and requesting re-sign`,
      );
      
      // 큐의 마지막 트랜잭션 가져오기 (최대 nonce)
      const updatedNonces = this.signedTxQueue.getAllNonces();
      if (updatedNonces.length > 0) {
        const maxNonce = Math.max(...updatedNonces);
        const removedTx = this.signedTxQueue.get(maxNonce);
        if (removedTx) {
          // 큐에서 마지막 nonce만 제거
          this.signedTxQueue.remove(maxNonce);
          this.callbacks.onLog?.(
            `[BROADCAST_REMOVE_LAST] removed nonce=${maxNonce} requesting re-sign for nonce=${requiredNonce} remainingQueueSize=${this.signedTxQueue.size()}`,
          );
          // 다시 서명 요청 (onGapFill 콜백 사용)
          this.callbacks.onGapFill(requiredNonce, removedTx);
        }
      }
    }

    // 브로드캐스트 재개 (에러 처리 플래그만 해제)
    this.callbacks.onLog?.(`[BROADCAST_RESUME] queueSize=${this.signedTxQueue.size()} requiredNonce=${this.nonceManager.getNextNonce()}`);
    this.isHandlingError = false;
    // start()는 이미 실행 중이므로 호출하지 않음
  }

  private async fillNonceGap(targetNonce: number): Promise<void> {
    const queueMinNonce = this.signedTxQueue.getMinNonce();
    const requiredNonce = this.nonceManager.getNextNonce();
    
    if (queueMinNonce === null) {
      return;
    }

    // 갭 채우기: requiredNonce부터 targetNonce-1까지
    const startNonce = requiredNonce;
    const endNonce = targetNonce;
    
    this.callbacks.onLog?.(
      `[FILL_GAP_START] startNonce=${startNonce} endNonce=${endNonce} queueMinNonce=${queueMinNonce}`,
    );

    for (let nonce = startNonce; nonce < endNonce; nonce++) {
      // 큐에 해당 nonce의 tx가 없으면 갭 채우기
      if (!this.signedTxQueue.get(nonce)) {
        const lastTx = this.signedTxQueue.getLastTx();
        if (lastTx) {
          // 마지막 tx를 복제하여 해당 nonce에 추가
          const clonedTx: SignedTx = {
            ...lastTx,
            // nonce는 getTransaction에서 다시 설정되므로 여기서는 복제만
          };
          this.callbacks.onLog?.(`[FILL_GAP] filling nonce=${nonce}`);
          this.callbacks.onGapFill(nonce, clonedTx);
        }
      }
    }
  }

  isActive(): boolean {
    return !this.isStopped && this.intervalId !== null;
  }

  isHandlingBroadcastError(): boolean {
    return this.isHandlingError;
  }
}
