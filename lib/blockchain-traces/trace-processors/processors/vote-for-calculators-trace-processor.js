"use strict";
const AbstractTracesProcessor = require("../abstract-traces-processor");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');
class VoteForCalculatorsTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.traceType = BlockchainTrTraces.getTypeVoteForCalculatorNodes();
        this.expectedActionsData = {
            votecalc: {
                validationSchema: {
                    voter: joi.string().required().min(1).max(12),
                    calculators: joi.array().items(joi.string()),
                },
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
        };
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.votecalc[0];
        return {
            from: actionData.act_data.voter,
            memo: '',
            to: null,
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.votecalc[0];
        return {
            calculators: actionData.act_data.calculators,
        };
    }
}
module.exports = VoteForCalculatorsTraceProcessor;
