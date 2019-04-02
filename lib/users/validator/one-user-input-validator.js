"use strict";
class OneUserInputValidator {
    static doesIdentityLooksLikeId(incomingValue) {
        return !!(incomingValue[0] !== '0' && +incomingValue);
    }
}
module.exports = OneUserInputValidator;
