interface KycServerError {
  message: string;
  error: string;
  statusCode: number;
}

export const isKycServerError = (error: unknown): error is KycServerError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "error" in error &&
    "statusCode" in error
  );
};

export class VerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

export class AlreadyVerifiedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlreadyVerifiedError";
  }
}

export class NotCompletedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotCompletedError";
  }
}
