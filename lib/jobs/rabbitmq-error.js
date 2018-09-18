class RabbitMqError extends Error {
  constructor (message, status) {
    super(message);

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = status || 500;
  }
}

class ConnectionRefusedError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.status = 500;
  }
}

module.exports = {
  RabbitMqError,
  ConnectionRefusedError
};
