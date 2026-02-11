/**
 * /api/sendToken 엔드포인트 RPS(초당 요청 수) 로드 테스트
 *
 * 사용법:
 *   tsx scripts/load-test-sendToken.ts
 *   CONCURRENCY=10 TOTAL=50 tsx scripts/load-test-sendToken.ts
 *
 * 환경변수:
 *   BASE_URL     - 서버 주소 (기본: http://localhost:8000)
 *   CONCURRENCY  - 동시 요청 수 (기본: 5)
 *   TOTAL        - 총 요청 수 (기본: 20)
 *   CHAIN        - chain ID (기본: config의 첫 번째 체인)
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8000";
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 5);
const TOTAL = Number(process.env.TOTAL ?? 20);
const CHAIN = process.env.CHAIN ?? "MAROO_TESTNET";

/**
 * 요청 인덱스 i → 테스트용 주소 (주소당 rate limit 회피)
 * 규칙: 0x + "1111...1111" + 인덱스를 hex 4자리로 (총 40 hex)
 * 예: i=0 → 0x11...110000, i=255 → 0x11...1100ff, i=256 → 0x11...110100
 * 낮은 주소(0x00...00~0x00...ff)는 블록체인에서 거부될 수 있으므로 0x1111... 영역 사용
 */
function addressForIndex(i: number): string {
  const hex = i.toString(16).padStart(4, "0").slice(-4);
  return `0x${"1".repeat(36)}${hex}`;
}

interface Result {
  status: number;
  durationMs: number;
  ok: boolean;
  requestIndex: number;
  address: string;
}

async function sendOne(requestIndex: number): Promise<Result> {
  const start = performance.now();
  const address = addressForIndex(requestIndex);
  try {
    const res = await fetch(`${BASE_URL}/api/sendToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        chain: CHAIN,
      }),
    });
    const durationMs = performance.now() - start;
    return {
      status: res.status,
      durationMs,
      ok: res.ok,
      requestIndex,
      address,
    };
  } catch (_err) {
    const durationMs = performance.now() - start;
    return { status: 0, durationMs, ok: false, requestIndex, address };
  }
}

async function run(): Promise<void> {
  console.log("=== /api/sendToken RPS 로드 테스트 ===\n");
  console.log(
    `BASE_URL=${BASE_URL}  CONCURRENCY=${CONCURRENCY}  TOTAL=${TOTAL}  CHAIN=${CHAIN}\n`,
  );

  const results: Result[] = [];
  const startTotal = performance.now();

  // CONCURRENCY씩 묶어서 보내기 (요청마다 서로 다른 주소 사용)
  for (let i = 0; i < TOTAL; i += CONCURRENCY) {
    const batchSize = Math.min(CONCURRENCY, TOTAL - i);
    const batch = Array.from({ length: batchSize }, (_, j) => sendOne(i + j));
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  const totalDurationSec = (performance.now() - startTotal) / 1000;

  // 집계
  const success = results.filter((r) => r.ok).length;
  const rateLimited = results.filter((r) => r.status === 429).length;
  const clientErrors = results.filter(
    (r) => r.status >= 400 && r.status !== 429,
  );
  const clientError = clientErrors.length;
  const failed = results.filter((r) => r.status === 0).length;
  const durations = results
    .map((r) => r.durationMs)
    .filter((d) => d > 0)
    .sort((a, b) => a - b);

  const avgMs = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  const p50 = durations[Math.floor(durations.length * 0.5)] ?? 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] ?? 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] ?? 0;

  const rps = results.length / totalDurationSec;

  console.log("--- 결과 ---");
  console.log(`총 요청:     ${results.length}`);
  console.log(`성공 (2xx):  ${success}`);
  console.log(`429 제한:    ${rateLimited}`);
  console.log(`4xx 기타:    ${clientError}`);
  console.log(`실패/타임아웃: ${failed}`);

  // 4xx 에러 상세 정보
  if (clientError > 0) {
    console.log("");
    console.log("--- 4xx 에러 상세 ---");
    const statusGroups = new Map<number, Result[]>();
    clientErrors.forEach((r) => {
      const status = r.status;
      if (!statusGroups.has(status)) {
        statusGroups.set(status, []);
      }
      statusGroups.get(status)!.push(r);
    });

    statusGroups.forEach((errors, status) => {
      console.log(`  ${status}: ${errors.length}건`);
      // 각 상태 코드별 첫 3개 에러의 상세 정보 출력
      const examples = errors.slice(0, 3);
      examples.forEach((err) => {
        console.log(
          `    - 주소: ${err.address}, 응답시간: ${err.durationMs.toFixed(2)}ms, 요청#${err.requestIndex}`,
        );
      });
      if (errors.length > 3) {
        console.log(`    ... 외 ${errors.length - 3}건`);
      }
    });
  }
  console.log("");
  console.log(`총 소요 시간: ${totalDurationSec.toFixed(2)}s`);
  console.log(`처리량 (RPS): ${rps.toFixed(2)} req/s`);
  console.log("");
  console.log("--- 응답 시간 (ms) ---");
  console.log(
    `평균: ${avgMs.toFixed(0)}  p50: ${p50.toFixed(0)}  p95: ${p95.toFixed(0)}  p99: ${p99.toFixed(0)}`,
  );
  console.log("");
}

run().catch(console.error);
