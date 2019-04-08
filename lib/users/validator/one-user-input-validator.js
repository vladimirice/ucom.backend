"use strict";
const LegacyAccountNamesDictionary = require("../dictionary/legacy-account-names-dictionary");
class OneUserInputValidator {
    static doesIdentityLooksLikeAccountName(incomingValue) {
        return incomingValue.length === 12
            || LegacyAccountNamesDictionary.isAccountNameLegacy(incomingValue);
    }
}
module.exports = OneUserInputValidator;
