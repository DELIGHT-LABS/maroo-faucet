interface KycServerError {
  message: string;
  error: string;
  statusCode: number;
}

const isKycServerError = (error: unknown): error is KycServerError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "error" in error &&
    "statusCode" in error
  );
};

// auto generated httpClient wraps server error inside 'error' field
export function extractKycServerError(e: unknown): KycServerError | null {
  if (
    typeof e === "object" &&
    e !== null &&
    "error" in e &&
    isKycServerError(e.error)
  ) {
    return e.error;
  }

  return null;
}

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

export class RequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestError";
  }
}
