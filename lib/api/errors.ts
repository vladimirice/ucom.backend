class AppError extends Error {
  public status;

  constructor(message, status = 500) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status;
  }
}

class BadRequestError extends Error {
  public status;

  constructor(fieldsAndMessages, status = 400) {
    const message = {
      errors: fieldsAndMessages,
    };

    // noinspection JSCheckFunctionSignatures
    super(JSON.stringify(message));

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status;
  }
}

class JoiBadRequestError extends Error {
  public status;

  constructor(error) {
    const message = {
      // eslint-disable-next-line no-use-before-define
      errors: formatJoiErrorMessages(error.details),
    };

    super(JSON.stringify(message));

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 400;
  }
}

class HttpUnauthorizedError extends Error {
  public status;

  constructor(message) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 401;
  }
}

class HttpForbiddenError extends Error {
  public status;

  // eslint-disable-next-line sonarjs/no-identical-functions
  constructor(message) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 401; // #task change to 403
  }
}

/**
 *
 * @param {Object[]} errors
 * @return {Array}
 */
function formatJoiErrorMessages(errors) {
  const result: any = [];

  for (const error of errors) {
    const { key } = error.context;
    result.push({
      field: key,
      message: error.message.replace(/["']+/g, ''),
    });
  }

  return result;
}

export {
  AppError,
  BadRequestError,
  HttpForbiddenError,
  HttpUnauthorizedError,
  JoiBadRequestError,
};
