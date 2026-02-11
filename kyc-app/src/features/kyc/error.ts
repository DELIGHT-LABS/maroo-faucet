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
