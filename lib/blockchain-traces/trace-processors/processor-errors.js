"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnableToProcessError extends Error {
    constructor(message = 'unable to process', status = 500) {
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
    }
}
exports.UnableToProcessError = UnableToProcessError;
class MalformedProcessingError extends Error {
    // eslint-disable-next-line sonarjs/no-identical-functions
    constructor(message = 'malformed processing error', status = 500) {
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
    }
}
exports.MalformedProcessingError = MalformedProcessingError;
