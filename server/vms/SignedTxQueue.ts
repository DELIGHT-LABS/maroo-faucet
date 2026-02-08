import type { SignedTx } from "./NonceManager";

export default class SignedTxQueue {
  private queue: Map<number, SignedTx>;

  constructor() {
    this.queue = new Map();
  }

  add(nonce: number, signedTx: SignedTx): void {
    this.queue.set(nonce, signedTx);
  }

  getMinNonce(): number | null {
    if (this.queue.size === 0) return null;
    return Math.min(...Array.from(this.queue.keys()));
  }

  get(nonce: number): SignedTx | undefined {
    return this.queue.get(nonce);
  }

  remove(nonce: number): boolean {
    return this.queue.delete(nonce);
  }

  getLastTx(): SignedTx | null {
    const nonces = Array.from(this.queue.keys()).sort((a, b) => b - a);
    return nonces.length > 0 ? this.queue.get(nonces[0]) || null : null;
  }

  size(): number {
    return this.queue.size;
  }

  clear(): void {
    this.queue.clear();
  }

  getAllNonces(): number[] {
    return Array.from(this.queue.keys()).sort((a, b) => a - b);
  }
}
