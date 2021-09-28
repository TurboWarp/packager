/**
 * A type of Error that indicates that the user has configured something wrong, and this error is not a bug.
 */
export class UserError extends Error {

}

export class AbortError extends Error {
  constructor (message) {
    super(message || 'The operation was aborted.');
    this.name = 'AbortError';
  }
}
