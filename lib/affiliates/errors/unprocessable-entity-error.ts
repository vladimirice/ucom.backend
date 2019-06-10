class UnprocessableEntityError extends Error {
  public status;

  constructor() {
    // noinspection JSCheckFunctionSignatures
    super('unprocessable entity');

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 400;
  }
}

export = UnprocessableEntityError;
