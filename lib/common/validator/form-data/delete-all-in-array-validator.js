"use strict";
const errors_1 = require("../../../api/errors");
class DeleteAllInArrayValidator {
    static isValueMeanDeleteAll(value) {
        if (!Array.isArray(value)) {
            throw new errors_1.AppError('This validator works only with array inputs');
        }
        if (value.length !== 1) {
            return false;
        }
        return value[0] === '';
    }
}
module.exports = DeleteAllInArrayValidator;
