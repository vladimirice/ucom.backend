class UnableToProcessError extends Error {
  public status;

  constructor(message = 'unable to process', status = 500) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status;
  }
}


class MalformedProcessingError extends Error {
  public status;

  // eslint-disable-next-line sonarjs/no-identical-functions
  constructor(message = 'malformed processing error', status = 500) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status;
  }
}

export {
  MalformedProcessingError,
  UnableToProcessError,
};
