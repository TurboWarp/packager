/**
 * Error indicating the user has misconfigured something.
 */
export class UserError extends Error {
  constructor (message) {
    super(message);
    this.name = 'UserError';
  }
}

/**
 * Error indicating a process was aborted.
 */
export class AbortError extends Error {
  constructor (message) {
    super(message || 'Aborted. Although this looks like a scary error, it\'s perfectly normal if you interrupted a loading bar.');
    this.name = 'AbortError';
  }
}

/**
 * Error indicating a network request was unsuccessful and the reason is unknown.
 */
export class UnknownNetworkError extends Error {
  constructor (url) {
    super(`Could not fetch ${url} for unknown reason.`);
    this.name = 'UnknownNetworkError';
    this.url = url;
  }
}

/**
 * Error indicating the packager is outdated and must be updated before it can continue.
 */
export class OutdatedPackagerError extends Error {
  constructor (message) {
    super(message);
    this.name = 'OutdatedPackagerError';
  }
}

/**
 * Error indicating an HTTP status error.
 */
export class HTTPError extends Error {
  constructor (message, status) {
    super(message);
    this.status = status;
    this.name = 'HTTPError';
  }
}

/**
 * Error indicating a project cannot be accessed, perhaps because it's unshared, doesn't exist, or has an invalid ID.
 */
export class CannotAccessProjectError extends Error {
  constructor (message) {
    super(message);
    this.name = 'CannotAccessProjectError';
  }
}
