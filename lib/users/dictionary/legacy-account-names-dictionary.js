"use strict";
const EnvHelper = require("../../common/helper/env-helper");
const accountNames = [
    'spirin',
    'sudokey',
    'karolinaer',
    'test',
    'ilya',
    'katyac',
    'jane',
    'romanov',
    'vlad',
    'anzor',
    'sergeis',
];
class LegacyAccountNamesDictionary {
    static isAccountNameLegacy(accountName) {
        if (EnvHelper.isProductionEnv()) {
            return false;
        }
        return !!~accountNames.indexOf(accountName);
    }
}
module.exports = LegacyAccountNamesDictionary;
