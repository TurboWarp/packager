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
