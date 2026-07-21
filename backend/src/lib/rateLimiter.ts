export interface RateLimiter {
  acquire(): Promise<void>;
  observe(headers: Record<string, unknown>): void;
  note429(retryAfterMs: number): void;
}

export interface RateLimiterOptions {
  minIntervalMs: number;
  lowRemainingThreshold: number;
  bufferMs: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function headerNumber(headers: Record<string, unknown>, name: string): number | null {
  const raw = headers[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { minIntervalMs, lowRemainingThreshold, bufferMs } = options;

  let chain: Promise<void> = Promise.resolve();
  let lastStartAt = 0;
  let cooldownUntil = 0;

  async function waitTurn(): Promise<void> {
    const now = Date.now();
    const sinceLast = now - lastStartAt;
    const untilInterval = Math.max(0, minIntervalMs - sinceLast);
    const untilCooldown = Math.max(0, cooldownUntil - now);
    const wait = Math.max(untilInterval, untilCooldown);
    if (wait > 0) await delay(wait);
    lastStartAt = Date.now();
  }

  return {
    acquire(): Promise<void> {
      const turn = chain.then(waitTurn);
      chain = turn.catch(() => undefined);
      return turn;
    },
    observe(headers: Record<string, unknown>): void {
      const remaining = headerNumber(headers, "x-ratelimit-remaining");
      const reset = headerNumber(headers, "x-ratelimit-reset");
      if (remaining !== null && remaining <= lowRemainingThreshold && reset !== null) {
        cooldownUntil = Math.max(cooldownUntil, reset * 1000 + bufferMs);
      }
    },
    note429(retryAfterMs: number): void {
      cooldownUntil = Math.max(cooldownUntil, Date.now() + retryAfterMs);
    },
  };
}
