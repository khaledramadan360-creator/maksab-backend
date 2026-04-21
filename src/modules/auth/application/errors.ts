export class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApplicationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Invalid credentials') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class InviteExpiredError extends ApplicationError {
  constructor(message: string = 'Invite link has expired') {
    super(message);
    this.name = 'InviteExpiredError';
  }
}

export class InviteNotUsableError extends ApplicationError {
  constructor(message: string = 'Invite is no longer usable') {
    super(message);
    this.name = 'InviteNotUsableError';
  }
}
