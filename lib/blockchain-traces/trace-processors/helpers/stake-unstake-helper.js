"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const joi = require('joi');
class StakeUnstakeHelper {
    static getDelegateBwValidationSchema() {
        return {
            from: joi.string().required().min(1).max(12),
            receiver: joi.string().required().min(1).max(12),
            stake_net_quantity: joi.string().required().regex(symbols_dictionary_1.UOS_REGEX),
            stake_cpu_quantity: joi.string().required().regex(symbols_dictionary_1.UOS_REGEX),
            transfer: joi.number().required(),
        };
    }
    static getUndelegateBwValidationSchema() {
        return {
            from: joi.string().required().min(1).max(12),
            receiver: joi.string().required().min(1).max(12),
            unstake_net_quantity: joi.string().required().regex(symbols_dictionary_1.UOS_REGEX),
            unstake_cpu_quantity: joi.string().required().regex(symbols_dictionary_1.UOS_REGEX),
        };
    }
    static getEmptyThumbnail() {
        return {
            resources: {
                cpu: {
                    tokens: {
                        currency: symbols_dictionary_1.UOS,
                        self_delegated: 0,
                    },
                    unstaking_request: {
                        amount: 0,
                        currency: symbols_dictionary_1.UOS,
                    },
                },
                net: {
                    tokens: {
                        currency: symbols_dictionary_1.UOS,
                        self_delegated: 0,
                    },
                    unstaking_request: {
                        amount: 0,
                        currency: symbols_dictionary_1.UOS,
                    },
                },
            },
        };
    }
}
module.exports = StakeUnstakeHelper;
