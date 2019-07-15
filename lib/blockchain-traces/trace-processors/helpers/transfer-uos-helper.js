"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const processor_errors_1 = require("../processor-errors");
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const joi = require('joi');
class TransferUosHelper {
    static getValidationSchema() {
        return {
            from: joi.string().required().min(1).max(12),
            to: joi.string().required().min(1).max(12),
            quantity: joi.string().required().regex(symbols_dictionary_1.UOS_REGEX),
            memo: joi.string().empty(''),
        };
    }
    static validateTraceActDataOrMalformed(traceAction) {
        const { error } = joi.validate(traceAction.act_data, TransferUosHelper.getValidationSchema(), {
            abortEarly: false,
            allowUnknown: false,
        });
        if (error) {
            throw new processor_errors_1.MalformedProcessingError(JSON.stringify(error));
        }
    }
    static getQuantity(traceAction) {
        return BalancesHelper.getTokensAmountFromString(traceAction.act_data.quantity, symbols_dictionary_1.UOS);
    }
}
module.exports = TransferUosHelper;
