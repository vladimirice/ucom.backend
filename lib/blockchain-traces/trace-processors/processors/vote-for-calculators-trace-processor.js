"use strict";
const AbstractTracesProcessor = require("../abstract-traces-processor");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');
class VoteForCalculatorsTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.serviceName = 'vote-for-calculators';
        this.traceType = BlockchainTrTraces.getTypeVoteForCalculatorNodes();
        this.expectedActionsData = {
            votecalc: {
                validationSchema: {
                    voter: joi.string().required().min(1).max(12),
                    calculators: joi.array().items(joi.string()),
                },
                numberOfActions: 1,
            },
        };
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.voteproducer[0];
        return {
            from: actionData.voter,
            memo: '',
            to: null,
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.votecalc[0];
        return {
            calculators: actionData.calculators,
        };
    }
}
module.exports = VoteForCalculatorsTraceProcessor;
