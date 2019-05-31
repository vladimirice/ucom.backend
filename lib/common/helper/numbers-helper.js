"use strict";
const errors_1 = require("../../api/errors");
class NumbersHelper {
    static generateRandomInteger(min, max) {
        return this.generateRandomNumber(min, max, 0);
    }
    static generateRandomNumber(min, max, precision) {
        return +(Math.random() * (max - min) + min).toFixed(precision);
    }
    static processFieldToBeNumeric(value, fieldName, precision = 0, disallowZero = true, disallowNegative = true) {
        const processed = +(+value).toFixed(precision);
        if (!Number.isFinite(processed)) {
            throw new errors_1.AppError(`Number is not finite. Field name is: ${fieldName}, basic value is: ${value}`);
        }
        if (disallowZero && processed === 0) {
            throw new errors_1.AppError(`It is not allowed for ${fieldName} to be zero. Initial value is: ${value}`);
        }
        if (disallowNegative && processed < 0) {
            throw new errors_1.AppError(`It is not allowed for ${fieldName} to be negative. Initial value is: ${value}`);
        }
        return processed;
    }
    static isNumberFinitePositiveIntegerOrBadRequestError(value) {
        if (Number.isFinite(value) && value > 0) {
            return;
        }
        throw new errors_1.BadRequestError(`Provided value should be finite positive integer but value is: ${value}`);
    }
}
module.exports = NumbersHelper;
