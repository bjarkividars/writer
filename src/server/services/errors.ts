export type ServiceErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UNAUTHORIZED";

export class ServiceError extends Error {
  code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}
