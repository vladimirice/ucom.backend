"use strict";
const winston_1 = require("../../../config/winston");
class ErrorEventToLogDto {
    constructor(message, extraJson, parentError) {
        this.message = message;
        this.extraJson = extraJson;
        this.parentError = parentError;
    }
    static createAndLogError(parentError, extraJson = {}, message = 'an error is occurred') {
        const obj = new ErrorEventToLogDto(message, extraJson, parentError);
        obj.logAsError();
    }
    logAsError() {
        winston_1.ApiLogger.error(this.message, Object.assign({ parentError: this.parentError }, this.extraJson));
    }
}
module.exports = ErrorEventToLogDto;
