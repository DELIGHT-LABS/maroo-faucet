/**
 * EIP-7702 Transaction Batching 테스트
 *
 * https://eip7702.io/examples#transaction-batching 형태로 동작합니다.
 * - 1) Authorization으로 EOA를 계정 구현체(Simple7702Account 등)에 위임
 * - 2) 위임된 EOA에 executeBatch(calls)를 호출해 여러 전송을 한 tx로 배치 전송
 *
 * 사용법:
 *   PK=0x... ACCOUNT_IMPLEMENTATION=0x... tsx scripts/rpc-sendtx-eip7702-test.ts
 *   PK=0x... ACCOUNT_IMPLEMENTATION=0x... BATCH_SIZE=20 TOTAL_TXS=100 tsx scripts/rpc-sendtx-eip7702-test.ts
 *
 * 환경변수:
 *   PK                        - 발송자 지갑 Private Key (필수)
 *   ACCOUNT_IMPLEMENTATION    - EIP-7702 계정 구현체 주소, 예: Simple7702Account (필수)
 *   RPC_URL                   - RPC 엔드포인트
 *   BATCH_SIZE                - executeBatch 한 번에 넣을 전송 개수 (기본: 20)
 *   TOTAL_TXS                 - 총 전송할 개수 (기본: 100)
 *   CHAIN_ID                  - Chain ID (기본: 450815)
 */

import { config } from "dotenv";
import { createPublicClient, createWalletClient, getAddress, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

config();

const PRIVATE_KEY = process.env.PK;
const RPC_URL =
  process.env.RPC_URL ?? "https://api.maroo-pretestnet.delightlabs.sh";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 450815);
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 500);
const TOTAL_TXS = Number(process.env.TOTAL_TXS ?? 1000);
const ACCOUNT_IMPLEMENTATION = process.env.ACCOUNT_IMPLEMENTATION as
  | `0x${string}`
  | undefined;

const TX_VALUE = BigInt(1); // 1 wei per transfer

// Simple7702Account.executeBatch(Call[] calls) ABI
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

/** 항상 40 hex (20 bytes) 주소. 인덱스 0~4095 지원. 체크섬 적용. */
function addressForIndex(i: number): `0x${string}` {
  const hex = i.toString(16).padStart(3, "0").slice(-3);
  const raw = `0x${"2".repeat(37)}${hex}` as `0x${string}`;
  return getAddress(raw) as `0x${string}`;
}

async function run(): Promise<void> {
  console.log("=== EIP-7702 Transaction Batching 테스트 ===\n");

  if (!PRIVATE_KEY) {
    console.error("❌ PK 환경변수가 필요합니다.");
    process.exit(1);
  }
  if (!ACCOUNT_IMPLEMENTATION) {
    console.error(
      "❌ ACCOUNT_IMPLEMENTATION 환경변수가 필요합니다. (예: Simple7702Account 주소)",
    );
    console.error("   참고: https://eip7702.io/examples#transaction-batching");
    process.exit(1);
  }

  const chain = {
    id: CHAIN_ID,
    name: "Maroo",
    nativeCurrency: { name: "OKRW", symbol: "OKRW", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  } as const;

  const account = privateKeyToAccount(
    (PRIVATE_KEY.startsWith("0x")
      ? PRIVATE_KEY
      : `0x${PRIVATE_KEY}`) as `0x${string}`,
  );

  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(RPC_URL),
  });

  console.log(`RPC_URL:                 ${RPC_URL}`);
  console.log(`CHAIN_ID:                ${CHAIN_ID}`);
  console.log(`ACCOUNT_IMPLEMENTATION:  ${ACCOUNT_IMPLEMENTATION}`);
  console.log(`발송 지갑:               ${account.address}`);
  console.log(`BATCH_SIZE:             ${BATCH_SIZE}`);
  console.log(`TOTAL_TXS:              ${TOTAL_TXS}\n`);

  const batchCount = Math.ceil(TOTAL_TXS / BATCH_SIZE);
  const testStartTime = performance.now();

  // --- Step 1: Authorization으로 EOA를 계정 구현체에 위임 (Basic authorization) ---
  console.log(
    "=== Step 1: EOA → 계정 구현체 위임 (signAuthorization + sendTransaction) ===\n",
  );

  const authorization = await walletClient.signAuthorization({
    contractAddress: ACCOUNT_IMPLEMENTATION,
    executor: "self",
  });

  const delegateTxHash = await walletClient.sendTransaction({
    authorizationList: [authorization],
    data: "0x",
    to: account.address,
  });
  console.log(`위임 tx 전송: ${delegateTxHash}`);

  const delegateReceipt = await publicClient.waitForTransactionReceipt({
    hash: delegateTxHash,
  });
  console.log(
    `위임 컨펌: block ${delegateReceipt.blockNumber}, status=${delegateReceipt.status}\n`,
  );

  if (delegateReceipt.status !== "success") {
    console.error("❌ 위임 트랜잭션이 실패했습니다.");
    process.exit(1);
  }

  // --- Step 2: executeBatch로 배치 전송 (Transaction batching) ---
  console.log("=== Step 2: executeBatch로 배치 전송 ===\n");

  const batchTxHashes: `0x${string}`[] = [];
  let batchSuccessCount = 0;

  for (let b = 0; b < batchCount; b++) {
    const start = b * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, TOTAL_TXS);
    const size = end - start;

    const calls = Array.from({ length: size }, (_, i) => ({
      target: addressForIndex(start + i),
      value: TX_VALUE,
      data: "0x" as `0x${string}`,
    }));

    const batchStartTime = performance.now();
    try {
      const hash = await walletClient.writeContract({
        abi: accountAbi,
        address: account.address,
        functionName: "executeBatch",
        args: [calls],
      });
      batchTxHashes.push(hash);
      const elapsed = (performance.now() - batchStartTime).toFixed(2);
      console.log(
        `[BATCH_${b + 1}/${batchCount}] ${size}개 전송 → tx ${hash} (${elapsed}ms)`,
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        batchSuccessCount += 1;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[BATCH_${b + 1}/${batchCount}] 실패: ${msg}`);
    }
  }

  const testEndTime = performance.now();
  const totalSec = (testEndTime - testStartTime) / 1000;

  console.log("\n=== 결과 ===\n");
  console.log(`배치 tx 수:     ${batchTxHashes.length}/${batchCount}`);
  console.log(`성공 배치:      ${batchSuccessCount}`);
  console.log(`총 소요:        ${totalSec.toFixed(2)}s`);
  console.log(`배치당 평균:    ${(totalSec / batchCount).toFixed(2)}s`);
  console.log("\n테스트 완료.\n");
}

run().catch((err) => {
  console.error("실행 오류:", err);
  process.exit(1);
});
