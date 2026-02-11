interface Step<T> {
  step: T;
  ms?: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function* iterate<T>(steps: Step<T>[]) {
  for (const { step, ms } of steps) {
    if (ms) {
      await sleep(ms);
    }
    yield step;
  }
}

function createStepper() {
  let nonce = 0;

  const run = async <T>(steps: Step<T>[], onChange: (next: T) => void) => {
    const current = ++nonce;
    for await (const next of iterate(steps)) {
      if (nonce !== current) {
        return;
      }
      onChange(next);
    }
  };

  const stop = () => {
    nonce++;
  };

  return { run, stop };
}

// Just for semantic clarity
export const useStepper = () => {
  return createStepper();
};
