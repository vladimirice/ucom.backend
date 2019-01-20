"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    constructor(message, status) {
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
        // @ts-ignore
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = 400;
    }
}
exports.JoiBadRequestError = JoiBadRequestError;
class HttpForbiddenError extends Error {
    constructor(message) {
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = 403;
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
