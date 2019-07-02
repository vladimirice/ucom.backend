"use strict";
const processor_errors_1 = require("../processor-errors");
const AbstractTracesProcessor = require("../abstract-traces-processor");
const BuySellRamHelper = require("../helpers/buy-sell-ram-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');
const actName = 'buyrambytes';
class BuyRamProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.expectedActionsData = {
            [actName]: {
                validationSchema: {
                    payer: joi.string().required().min(1).max(12),
                    receiver: joi.string().required().min(1).max(12),
                    bytes: joi.number().required(),
                },
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
        };
        this.traceType = BlockchainTrTraces.getTypeBuyRamBytes();
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray[actName][0];
        return {
            from: actionData.act_data.payer,
            to: null,
            memo: '',
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray[actName][0];
        let ramPrice = 0;
        let ramFee = 0;
        try {
            ({ ramPrice, ramFee } = BuySellRamHelper.getRamPriceAndFee(actionData, this.traceType));
        }
        catch (error) {
            if (error instanceof processor_errors_1.MalformedProcessingError) {
                this.throwMalformedError(error.message);
            }
            throw error;
        }
        const { bytes } = actionData.act_data;
        const tokensAmount = ramPrice + ramFee;
        return BuySellRamHelper.getThumbnail(bytes, tokensAmount);
    }
}
module.exports = BuyRamProcessor;
