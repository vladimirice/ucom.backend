class TrTracesProcessorError extends Error {
  constructor (message, data) {
    // tslint:disable-next-line:max-line-length
    const processedMessage = `Transaction traces error. Transaction is skipped. Message: ${message}. Data ${JSON.stringify(data)}`;
    // noinspection JSCheckFunctionSignatures
    super(JSON.stringify(processedMessage));

    this.name = this.constructor.name;
    // noinspection JSUnresolvedFunction
    Error.captureStackTrace(this, this.constructor);

    // @ts-ignore
    this.status = 500;
  }
}

export {
  TrTracesProcessorError,
};
