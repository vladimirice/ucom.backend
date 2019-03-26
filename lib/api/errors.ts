class AppError extends Error {
  public status;

  constructor(message, status) {
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

    // @ts-ignore
    super(message);

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
  for (let i = 0; i < errors.length; i += 1) {
    // eslint-disable-next-line
    const { key } = errors[i].context;
    result.push({
      field: key,
      // eslint-disable-next-line
      message: errors[i].message.replace(/["']+/g, ''),
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
