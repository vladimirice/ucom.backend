class AppError extends Error {
  constructor (message, status) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status || 500;
  }
}

class BadRequestError extends Error {
  constructor (fieldsAndMessages) {

    const message = {
      'errors': fieldsAndMessages
    };

    // noinspection JSCheckFunctionSignatures
    super(JSON.stringify(message));

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 400;
  }
}

class JoiBadRequestError extends Error {
  constructor (error) {

    const message = {
      'errors': formatJoiErrorMessages(error.details)
    };

    // noinspection JSCheckFunctionSignatures
    super(JSON.stringify(message));

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 400;
  }
}

class HttpForbiddenError extends Error {
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
  let result = [];
  for(let i = 0; i < errors.length; i++) {
    let key = errors[i].context.key;
    result.push({
      field: key,
      message: errors[i].message.replace(/['"]+/g, '')
    });
  }

  return result;
}


module.exports = {
  AppError,
  BadRequestError,
  HttpForbiddenError,
  JoiBadRequestError
};
