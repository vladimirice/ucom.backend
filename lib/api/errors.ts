class AppError extends Error {
  // @ts-ignore
  private status;

  constructor (message, status) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status;
  }
}

class BadRequestError extends Error {
  // @ts-ignore
  private status;

  constructor (fieldsAndMessages, status = 400) {

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
  // @ts-ignore
  private status;

  constructor (error) {

    const message = {
      errors: formatJoiErrorMessages(error.details),
    };

    // @ts-ignore
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 400;
  }
}

class HttpForbiddenError extends Error {
  // @ts-ignore
  private status;

  constructor (message) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 403;
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
    const key = errors[i].context.key;
    result.push({
      field: key,
      message: errors[i].message.replace(/['"]+/g, ''),
    });
  }

  return result;
}

export {
  AppError,
  BadRequestError,
  HttpForbiddenError,
  JoiBadRequestError,
};
