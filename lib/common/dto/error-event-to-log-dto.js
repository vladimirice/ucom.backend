"use strict";
class ErrorEventToLogDto {
    constructor(message, extraJson, parentError) {
        this.message = message;
        this.extraJson = extraJson;
        this.parentError = parentError;
    }
}
module.exports = ErrorEventToLogDto;
