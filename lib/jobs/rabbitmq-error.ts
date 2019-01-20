class RabbitMqError extends Error {
  constructor (message, status) {
    // noinspection JSCheckFunctionSignatures
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    // @ts-ignore
    this.status = status || 500;
  }
}

class ConnectionRefusedError extends Error {
  constructor (message) {
    // noinspection JSCheckFunctionSignatures
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    // @ts-ignore
    this.status = 500;
  }
}

module.exports = {
  RabbitMqError,
  ConnectionRefusedError,
};
