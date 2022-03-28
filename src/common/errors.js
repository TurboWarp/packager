/**
 * A type of Error that indicates that the user has configured something wrong, and this error is not a bug.
 */
export class UserError extends Error {

}

export class AbortError extends Error {
  constructor (message) {
    super(message || 'Aborted. Although this looks like a scary error, it\'s perfectly normal if you interrupted a loading bar.');
    this.name = 'AbortError';
  }
}

export class UnknownNetworkError extends Error {
  constructor (url) {
    super(`Could not fetch ${url}`);
    this.url = url;
  }
}
