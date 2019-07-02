"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const AbstractTracesProcessor = require("../abstract-traces-processor");
const TransferUosHelper = require("../helpers/transfer-uos-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');
class ClaimEmissionTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.expectedActionsData = {
            withdrawal: {
                validationSchema: {
                    owner: joi.string().required().min(1).max(12),
                },
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
        };
        this.traceType = BlockchainTrTraces.getTypeClaimEmission();
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.withdrawal[0];
        return {
            from: actionData.act_data.owner,
            memo: '',
            to: null,
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const action = actNameToActionDataArray.withdrawal[0];
        const inlineTraces = action.inline_traces;
        if (inlineTraces.length !== 2) {
            this.throwMalformedError('inlineTraces.length !== 2');
        }
        const issueTrace = inlineTraces.find(item => item.act.name === 'issue');
        if (!issueTrace) {
            this.throwMalformedError('There is no issue trace');
        }
        const transferInlineTrace = inlineTraces.find(item => item.act.name === 'transfer');
        if (!transferInlineTrace) {
            this.throwMalformedError('There is no transfer transaction');
        }
        return {
            tokens: {
                currency: symbols_dictionary_1.UOS,
                emission: TransferUosHelper.getQuantity(transferInlineTrace),
            },
        };
    }
}
module.exports = ClaimEmissionTraceProcessor;
