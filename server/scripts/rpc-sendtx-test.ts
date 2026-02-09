/**
 * RPC sendTransaction 비동기 처리 성능 테스트
 *
 * RPC mempool은 연속된 nonce를 순서대로 받아서 버퍼에 모은 후,
 * 블록 생성 시 한번에 처리합니다. 이 스크립트는 nonce 순서를 보장하면서
 * 트랜잭션을 빠르게 비동기로 전송하여 RPC의 처리 능력을 테스트합니다.
 *
 * ethers의 provider.broadcastTransaction()은 노드가 트랜잭션을 수락(mempool)하면
 * 곧바로 TransactionResponse를 반환하며, 블록 컨펌을 기다리지 않습니다.
 *
 * 사용법:
 *   PK=0x... tsx scripts/rpc-sendtx-test.ts
 *   PK=0x... BATCH_SIZE=10 TX_INTERVAL_MS=100 TOTAL_TXS=50 tsx scripts/rpc-sendtx-test.ts
 *
 * 환경변수:
 *   PK                 - 발송자 지갑 Private Key (필수)
 *   RPC_URL            - RPC 엔드포인트 (기본: https://api.maroo-pretestnet.delightlabs.sh)
 *   BATCH_SIZE         - 한 번에 서명할 트랜잭션 수 (기본: 10)
 *   TX_INTERVAL_MS     - 트랜잭션 전송 간격 (ms) (기본: 0 = 최대한 빠르게)
 *   TOTAL_TXS          - 총 전송할 트랜잭션 수 (기본: 50)
 *   CHAIN_ID           - Chain ID (기본: 450815)
 */

import { config } from "dotenv";
import { JsonRpcProvider, Transaction, Wallet } from "ethers";

// .env 파일 로드 시도
config();

// 환경변수 설정
const PRIVATE_KEY = process.env.PK;
const RPC_URL =
  process.env.RPC_URL ?? "https://api.maroo-pretestnet.delightlabs.sh";
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 100);
const TX_INTERVAL_MS = Number(process.env.TX_INTERVAL_MS ?? 0);
const TOTAL_TXS = Number(process.env.TOTAL_TXS ?? 200);
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 450815);

// 트랜잭션 가스 설정 (ethers는 bigint 사용)
const GAS_LIMIT = BigInt(21000);
const MAX_PRIORITY_FEE = BigInt(0);
const MAX_FEE = BigInt("200000000000000000"); // 0.2 tOKRW
const TX_VALUE = BigInt(1); // 1 wei

interface SignedTransaction {
  index: number;
  nonce: number;
  rawTransaction: string;
  txHash: string;
  receiver: string;
  signedAt: number;
}

interface BroadcastResult {
  index: number;
  nonce: number;
  txHash: string;
  receiver: string;
  success: boolean;
  error?: string;
  broadcastStartTime: number;
  broadcastEndTime: number;
  broadcastDurationMs: number;
}

/**
 * 요청 인덱스 i → 테스트용 주소
 */
function addressForIndex(i: number): string {
  const hex = i.toString(16).padStart(2, "0");
  return `0x${"2".repeat(38)}${hex}`;
}

/**
 * 트랜잭션 서명 (비동기) - ethers Wallet.signTransaction
 */
async function signTransaction(
  wallet: Wallet,
  receiver: string,
  nonce: number,
  index: number,
): Promise<SignedTransaction> {
  const signStartTime = performance.now();

  const tx = {
    type: 2 as const,
    chainId: CHAIN_ID,
    gasLimit: GAS_LIMIT,
    nonce,
    to: receiver,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE,
    maxFeePerGas: MAX_FEE,
    value: TX_VALUE,
  };

  try {
    const serialized = await wallet.signTransaction(tx);
    const parsed = Transaction.from(serialized);
    const txHash = parsed.hash ?? "";
    const signDuration = performance.now() - signStartTime;

    console.log(
      `[SIGN] index=${index} nonce=${nonce} receiver=${receiver.substring(0, 10)}... duration=${signDuration.toFixed(2)}ms`,
    );

    return {
      index,
      nonce,
      rawTransaction: serialized,
      txHash,
      receiver,
      signedAt: Date.now(),
    };
  } catch (err: unknown) {
    const signDuration = performance.now() - signStartTime;
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[SIGN_ERROR] index=${index} nonce=${nonce} error=${message} duration=${signDuration.toFixed(2)}ms`,
    );
    throw err;
  }
}

/** TXPOOL 수락 결과: response가 있으면 mempool 수락, error가 있으면 RPC 거부 */
interface MempoolResult {
  response: Awaited<ReturnType<JsonRpcProvider["broadcastTransaction"]>> | null;
  signedTx: SignedTransaction;
  broadcastStartTime: number;
  error?: string;
}

/**
 * 서명된 트랜잭션을 RPC에 보냄. TXPOOL 수락(txHash 응답)만 확인하고 반환.
 * 채굴 결과는 호출측에서 response.wait()로 대기.
 */
async function sendToMempool(
  provider: JsonRpcProvider,
  signedTx: SignedTransaction,
  broadcastStartTime: number,
): Promise<MempoolResult> {
  try {
    const response = await provider.broadcastTransaction(
      signedTx.rawTransaction,
    );
    return { response, signedTx, broadcastStartTime };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[BROADCAST_ERROR] index=${signedTx.index} nonce=${signedTx.nonce} error=${message}`,
    );
    return { response: null, signedTx, broadcastStartTime, error: message };
  }
}

/**
 * Mempool 결과 배열을 받아 각 tx의 채굴 결과(receipt)를 기다린 뒤 BroadcastResult[] 생성
 */
async function waitForTxResults(
  mempoolResults: MempoolResult[],
): Promise<BroadcastResult[]> {
  const results = await Promise.all(
    mempoolResults.map(async (m): Promise<BroadcastResult> => {
      const { signedTx, broadcastStartTime } = m;
      if (m.error ?? !m.response) {
        const broadcastEndTime = performance.now();
        return {
          index: signedTx.index,
          nonce: signedTx.nonce,
          txHash: signedTx.txHash,
          receiver: signedTx.receiver,
          success: false,
          error: m.error,
          broadcastStartTime,
          broadcastEndTime,
          broadcastDurationMs: broadcastEndTime - broadcastStartTime,
        };
      }
      try {
        const receipt = await m.response.wait();
        const broadcastEndTime = performance.now();
        const success = receipt != null && receipt.status === 1;
        return {
          index: signedTx.index,
          nonce: signedTx.nonce,
          txHash: signedTx.txHash,
          receiver: signedTx.receiver,
          success,
          error: success ? undefined : "reverted",
          broadcastStartTime,
          broadcastEndTime,
          broadcastDurationMs: broadcastEndTime - broadcastStartTime,
        };
      } catch (err: unknown) {
        const broadcastEndTime = performance.now();
        const message = err instanceof Error ? err.message : String(err);
        return {
          index: signedTx.index,
          nonce: signedTx.nonce,
          txHash: signedTx.txHash,
          receiver: signedTx.receiver,
          success: false,
          error: message,
          broadcastStartTime,
          broadcastEndTime,
          broadcastDurationMs: broadcastEndTime - broadcastStartTime,
        };
      }
    }),
  );
  return results;
}

/**
 * 메인 테스트 함수
 */
async function run(): Promise<void> {
  console.log("=== RPC sendTransaction 비동기 처리 성능 테스트 (ethers) ===\n");

  // Private Key 검증
  if (!PRIVATE_KEY) {
    console.error("❌ PRIVATE_KEY 환경변수가 설정되지 않았습니다.");
    console.error("사용법: PRIVATE_KEY=0x... tsx scripts/rpc-sendtx-test.ts");
    process.exit(1);
  }

  console.log(`RPC_URL:        ${RPC_URL}`);
  console.log(`CHAIN_ID:       ${CHAIN_ID}`);
  console.log(`BATCH_SIZE:     ${BATCH_SIZE}`);
  console.log(`TX_INTERVAL_MS: ${TX_INTERVAL_MS}ms`);
  console.log(`TOTAL_TXS:      ${TOTAL_TXS}\n`);

  // ethers 초기화
  const provider = new JsonRpcProvider(RPC_URL);
  const privateKey = PRIVATE_KEY.startsWith("0x")
    ? PRIVATE_KEY
    : `0x${PRIVATE_KEY}`;
  const wallet = new Wallet(privateKey, provider);

  console.log(`발송 지갑 주소: ${wallet.address}\n`);

  // 현재 nonce 가져오기
  const currentNonce = await provider.getTransactionCount(
    wallet.address,
    "latest",
  );
  console.log(`시작 nonce: ${currentNonce}\n`);

  const testStartTime = performance.now();
  const signedTxBatches: SignedTransaction[][] = [];
  const allBroadcastResults: BroadcastResult[] = [];

  // Phase 1: 비동기로 트랜잭션 서명 (배치 단위로)
  console.log("=== Phase 1: 트랜잭션 서명 (비동기) ===\n");

  const batchCount = Math.ceil(TOTAL_TXS / BATCH_SIZE);

  for (let batchIdx = 0; batchIdx < batchCount; batchIdx++) {
    const batchStart = batchIdx * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_TXS);
    const batchSize = batchEnd - batchStart;

    console.log(
      `[BATCH_${batchIdx + 1}/${batchCount}] 서명 시작 (${batchSize}개 트랜잭션)`,
    );
    const batchSignStartTime = performance.now();

    // 배치 내 모든 트랜잭션 병렬 서명
    const signPromises: Promise<SignedTransaction>[] = [];
    for (let i = batchStart; i < batchEnd; i++) {
      const receiver = addressForIndex(i);
      const nonce = currentNonce + i;
      signPromises.push(signTransaction(wallet, receiver, nonce, i));
    }

    try {
      const signedBatch = await Promise.all(signPromises);

      // nonce 순서대로 정렬 (비동기로 완료되어 순서가 틀어질 수 있음)
      signedBatch.sort((a, b) => a.nonce - b.nonce);

      signedTxBatches.push(signedBatch);
      const batchSignDuration = performance.now() - batchSignStartTime;

      // nonce 범위 확인
      const minNonce = signedBatch[0]?.nonce;
      const maxNonce = signedBatch[signedBatch.length - 1]?.nonce;
      console.log(
        `[BATCH_${batchIdx + 1}/${batchCount}] 서명 완료 (${batchSize}개) nonce ${minNonce}~${maxNonce} - ${batchSignDuration.toFixed(2)}ms\n`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[BATCH_${batchIdx + 1}/${batchCount}] 서명 실패: ${message}\n`,
      );
      // 실패한 배치는 건너뜀
    }
  }

  const totalSigned = signedTxBatches.reduce(
    (sum, batch) => sum + batch.length,
    0,
  );
  console.log(`총 서명된 트랜잭션: ${totalSigned}개\n`);

  if (totalSigned === 0) {
    console.error("❌ 서명된 트랜잭션이 없습니다. 테스트를 종료합니다.");
    return;
  }

  // 모든 배치를 하나로 합쳐서 nonce 순서로 정렬 후 다시 배치로 분할
  console.log("트랜잭션 nonce 순서 정렬 중...\n");
  const allSignedTxs = signedTxBatches.flat();
  allSignedTxs.sort((a, b) => a.nonce - b.nonce);

  // 정렬된 트랜잭션을 다시 배치로 분할
  signedTxBatches.length = 0; // 기존 배치 초기화
  for (let i = 0; i < allSignedTxs.length; i += BATCH_SIZE) {
    const batch = allSignedTxs.slice(
      i,
      Math.min(i + BATCH_SIZE, allSignedTxs.length),
    );
    signedTxBatches.push(batch);
  }

  // Phase 2: nonce 순서대로 순차 브로드캐스트
  console.log(`=== Phase 2: 트랜잭션 브로드캐스트 (nonce 순서 보장) ===`);
  console.log(`  - 트랜잭션 간 간격: ${TX_INTERVAL_MS}ms\n`);

  for (let batchIdx = 0; batchIdx < signedTxBatches.length; batchIdx++) {
    const batch = signedTxBatches[batchIdx];

    if (batch.length === 0) {
      continue;
    }

    // 브로드캐스트 전 nonce 순서 재확인 및 정렬
    batch.sort((a, b) => a.nonce - b.nonce);

    const minNonce = batch[0]?.nonce;
    const maxNonce = batch[batch.length - 1]?.nonce;
    console.log(
      `[BATCH_${batchIdx + 1}/${signedTxBatches.length}] 브로드캐스트 시작 (${batch.length}개 트랜잭션) nonce ${minNonce}~${maxNonce}`,
    );
    const batchBroadcastStartTime = performance.now();

    // 루프: txHash(TXPOOL 수락)를 받은 뒤에만 다음 tx 전송. receipt는 기다리지 않음.
    const mempoolResults: MempoolResult[] = [];
    for (let txIdx = 0; txIdx < batch.length; txIdx++) {
      const signedTx = batch[txIdx];
      const sendTime = performance.now() - batchBroadcastStartTime;
      console.log(
        `[SEND] index=${signedTx.index} nonce=${signedTx.nonce} at ${sendTime.toFixed(2)}ms`,
      );
      const broadcastStartTime = performance.now();
      const result = await sendToMempool(
        provider,
        signedTx,
        broadcastStartTime,
      );
      mempoolResults.push(result);
    }
    const mempoolOkCount = mempoolResults.filter(
      (m) => m.response != null,
    ).length;
    const mempoolDuration = performance.now() - batchBroadcastStartTime;
    console.log(
      `[BATCH_${batchIdx + 1}/${signedTxBatches.length}] TXPOOL 수락 완료 - ${mempoolOkCount}/${batch.length} (${mempoolDuration.toFixed(2)}ms)`,
    );

    // 루프 끝난 후: 전송한 tx들의 채굴 결과(receipt)를 모두 기다림
    const batchResults = await waitForTxResults(mempoolResults);
    allBroadcastResults.push(...batchResults);

    const batchSuccessCount = batchResults.filter((r) => r.success).length;
    const totalBatchDuration = performance.now() - batchBroadcastStartTime;
    console.log(
      `[BATCH_${batchIdx + 1}/${signedTxBatches.length}] TX 결과 대기 완료 - 성공: ${batchSuccessCount}/${batch.length} - 총 ${totalBatchDuration.toFixed(2)}ms\n`,
    );
  }

  const testEndTime = performance.now();
  const totalDurationSec = (testEndTime - testStartTime) / 1000;

  // 결과 집계
  console.log("\n=== 테스트 결과 ===\n");

  const totalBroadcasted = allBroadcastResults.length;
  const successCount = allBroadcastResults.filter((r) => r.success).length;
  const failCount = allBroadcastResults.filter((r) => !r.success).length;

  console.log(`총 트랜잭션:      ${totalBroadcasted}개`);
  console.log(`성공:            ${successCount}개`);
  console.log(`실패:            ${failCount}개`);
  console.log(`총 소요 시간:     ${totalDurationSec.toFixed(2)}s`);
  console.log(
    `처리량 (TPS):     ${(totalBroadcasted / totalDurationSec).toFixed(2)} tx/s`,
  );

  // 브로드캐스트 시간 통계
  if (successCount > 0) {
    const broadcastDurations = allBroadcastResults
      .filter((r) => r.success)
      .map((r) => r.broadcastDurationMs)
      .sort((a, b) => a - b);

    const avgMs =
      broadcastDurations.reduce((a, b) => a + b, 0) / broadcastDurations.length;
    const p50 =
      broadcastDurations[Math.floor(broadcastDurations.length * 0.5)] ?? 0;
    const p95 =
      broadcastDurations[Math.floor(broadcastDurations.length * 0.95)] ?? 0;
    const p99 =
      broadcastDurations[Math.floor(broadcastDurations.length * 0.99)] ?? 0;
    const minMs = broadcastDurations[0] ?? 0;
    const maxMs = broadcastDurations[broadcastDurations.length - 1] ?? 0;

    console.log("\n--- 브로드캐스트 응답 시간 (ms) ---");
    console.log(
      `평균: ${avgMs.toFixed(0)}  중앙값: ${p50.toFixed(0)}  p95: ${p95.toFixed(0)}  p99: ${p99.toFixed(0)}`,
    );
    console.log(`최소: ${minMs.toFixed(0)}  최대: ${maxMs.toFixed(0)}`);
  }

  // 실패한 트랜잭션 상세 정보
  if (failCount > 0) {
    console.log("\n--- 실패한 트랜잭션 ---");
    const failedResults = allBroadcastResults.filter((r) => !r.success);

    // 에러 타입별 그룹화
    const errorGroups = new Map<string, BroadcastResult[]>();
    failedResults.forEach((result) => {
      const errorMsg = result.error ?? "Unknown error";
      if (!errorGroups.has(errorMsg)) {
        errorGroups.set(errorMsg, []);
      }
      errorGroups.get(errorMsg)!.push(result);
    });

    errorGroups.forEach((results, errorMsg) => {
      console.log(`\n에러: ${errorMsg} (${results.length}건)`);
      const examples = results.slice(0, 3);
      examples.forEach((r) => {
        console.log(
          `  - index=${r.index} nonce=${r.nonce} txHash=${r.txHash.substring(0, 10)}...`,
        );
      });
      if (results.length > 3) {
        console.log(`  ... 외 ${results.length - 3}건`);
      }
    });
  }

  console.log("\n테스트 완료!\n");
}

// 실행
run().catch((err) => {
  console.error("테스트 실행 중 오류 발생:", err);
  process.exit(1);
});
