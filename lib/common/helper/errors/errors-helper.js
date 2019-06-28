"use strict";
const errors_1 = require("../../../api/errors");
class ErrorsHelper {
    static throwUnsupportedParamAppError(param) {
        throw new errors_1.AppError(`Unsupported parameter: ${param}`);
    }
}
module.exports = ErrorsHelper;
