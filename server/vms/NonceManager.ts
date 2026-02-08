export type SignedTx = {
  rawTransaction: string;
  txHash: string;
  receiver: string;
  amount: any;
  id?: string;
};

export default class NonceManager {
  private requiredNonce: number; // 블록체인이 필요로 하는 nonce
  private lastSentNonce: number; // 마지막으로 전송한 nonce
  private allocatedNonce: number; // 다음에 할당할 nonce

  constructor() {
    this.requiredNonce = -1;
    this.lastSentNonce = -1;
    this.allocatedNonce = -1;
  }

  async initialize(web3: any, address: string): Promise<void> {
    // 초기화 시 블록체인에서 조회
    this.requiredNonce = await web3.eth.getTransactionCount(address, "latest");
    this.lastSentNonce = this.requiredNonce - 1;
    this.allocatedNonce = this.requiredNonce;
  }

  getNextNonce(): number {
    return this.requiredNonce;
  }

  allocateNonce(): number {
    // nonce 할당 (서명 시 사용)
    const nonce = this.allocatedNonce;
    this.allocatedNonce++;
    return nonce;
  }

  markSent(nonce: number): void {
    // 서명 완료 시점에 호출되므로, nonce가 requiredNonce 이상이면 업데이트
    // 다음 서명이 증가된 nonce를 사용하도록 requiredNonce를 nonce + 1로 설정
    if (nonce >= this.requiredNonce) {
      this.requiredNonce = nonce + 1;
      this.lastSentNonce = nonce;
    }
  }

  async resetOnError(web3: any, address: string): Promise<void> {
    // 에러 발생 시 블록체인에서 재조회
    this.requiredNonce = await web3.eth.getTransactionCount(address, "latest");
    // allocatedNonce도 requiredNonce로 재설정 (다음 서명이 올바른 nonce를 받도록)
    this.allocatedNonce = this.requiredNonce;
  }

  updateAllocatedNonceFromQueue(queueMaxNonce: number | null): void {
    // 큐에 nonce가 있으면 allocatedNonce를 큐의 최대값+1로 업데이트
    if (queueMaxNonce !== null && queueMaxNonce >= this.allocatedNonce) {
      this.allocatedNonce = queueMaxNonce + 1;
    }
  }

  getRequiredNonce(): number {
    return this.requiredNonce;
  }

  getLastSentNonce(): number {
    return this.lastSentNonce;
  }
}
