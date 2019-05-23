"use strict";
const CommonChecker = require("../common/common-checker");
const uosAccountsPropertiesInterfaceRules = {
    staked_balance: {
        type: 'number',
        length: 0,
    },
    validity: {
        type: 'number',
        length: 0,
    },
    importance: {
        type: 'number',
        length: 0,
    },
    scaled_importance: {
        type: 'number',
        length: 0,
    },
    stake_rate: {
        type: 'number',
        length: 0,
    },
    scaled_stake_rate: {
        type: 'number',
        length: 0,
    },
    social_rate: {
        type: 'number',
        length: 0,
    },
    scaled_social_rate: {
        type: 'number',
        length: 0,
    },
    transfer_rate: {
        type: 'number',
        length: 0,
    },
    scaled_transfer_rate: {
        type: 'number',
        length: 0,
    },
    previous_cumulative_emission: {
        type: 'number',
        length: 0,
    },
    current_emission: {
        type: 'number',
        length: 0,
    },
    current_cumulative_emission: {
        type: 'number',
        length: 0,
    },
};
const uosAccountsProperties = {
    exactKeysAmount: true,
};
class UsersChecker {
    static checkUosAccountsPropertiesStructure(model) {
        CommonChecker.checkOneObjectInterface(model.uos_accounts_properties, uosAccountsPropertiesInterfaceRules, uosAccountsProperties);
    }
}
module.exports = UsersChecker;
