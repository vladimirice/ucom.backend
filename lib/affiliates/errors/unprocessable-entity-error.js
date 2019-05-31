"use strict";
class UnprocessableEntityError extends Error {
    constructor() {
        // noinspection JSCheckFunctionSignatures
        super('unprocessable entity');
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.status = 400;
    }
}
module.exports = UnprocessableEntityError;
