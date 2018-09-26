class AppError extends Error {
  constructor (message, status) {
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

    super(JSON.stringify(message));

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 400;
  }
}

class HttpForbiddenError extends Error {
  constructor (message) {
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 403;
  }
}

module.exports = {
  AppError,
  BadRequestError,
  HttpForbiddenError
};
