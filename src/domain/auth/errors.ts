export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AccountExistsWithDifferentCredentialError extends AuthError {}
export class AuthPopupClosedError extends AuthError {}
export class InvalidCredentialsError extends AuthError {}
export class InvalidServerResponseError extends AuthError {}
export class NetworkAuthError extends AuthError {}
export class SessionExpiredError extends AuthError {}
export class UserDisabledError extends AuthError {}

export class ServerAuthenticationError extends AuthError {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class UnexpectedAuthError extends AuthError {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
