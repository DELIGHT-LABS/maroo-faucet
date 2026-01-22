export class RateLimitError extends Error {
  retryAfter: number; // seconds until rate limit resets

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export const isRateLimitError = (error: unknown): error is RateLimitError => {
  return error instanceof RateLimitError;
};
