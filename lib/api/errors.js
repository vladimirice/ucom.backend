"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable max-classes-per-file */
class AppError extends Error {
    constructor(message, status = 500) {
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = status;
    }
}
exports.AppError = AppError;
class BadRequestError extends Error {
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
exports.BadRequestError = BadRequestError;
class JoiBadRequestError extends Error {
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
exports.JoiBadRequestError = JoiBadRequestError;
class HttpUnauthorizedError extends Error {
    constructor(message) {
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = 401;
    }
}
exports.HttpUnauthorizedError = HttpUnauthorizedError;
class HttpForbiddenError extends Error {
    // eslint-disable-next-line sonarjs/no-identical-functions
    constructor(message) {
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = 401; // #task change to 403
    }
}
exports.HttpForbiddenError = HttpForbiddenError;
/**
 *
 * @param {Object[]} errors
 * @return {Array}
 */
function formatJoiErrorMessages(errors) {
    const result = [];
    for (const error of errors) {
        const { key } = error.context;
        result.push({
            field: key,
            message: error.message.replace(/["']+/g, ''),
        });
    }
    return result;
}
function getErrorMessagePair(field, message) {
    return [{
            field,
            message,
        }];
}
exports.getErrorMessagePair = getErrorMessagePair;
