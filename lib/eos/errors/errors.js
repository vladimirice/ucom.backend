class TrTracesProcessorError extends Error {
  constructor (message, data) {
    const processedMessage = `Transaction traces error. Transaction is skipped. Message: ${message}. Data ${JSON.stringify(data)}`;
    // noinspection JSCheckFunctionSignatures
    super(JSON.stringify(processedMessage));

    this.name = this.constructor.name;
    // noinspection JSUnresolvedFunction
    Error.captureStackTrace(this, this.constructor);

    this.status = 500;
  }
}

module.exports = {
  TrTracesProcessorError,
};