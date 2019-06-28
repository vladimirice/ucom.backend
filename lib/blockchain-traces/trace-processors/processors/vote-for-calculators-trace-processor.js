"use strict";
const AbstractTracesProcessor = require("../abstract-traces-processor");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');
class VoteForCalculatorsTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.actionDataSchema = {
            voter: joi.string().required().min(1).max(12),
            calculators: joi.array().items(joi.string()),
        };
        this.expectedActName = 'votecalc';
        this.expectedActionsLength = 1;
        this.serviceName = 'vote-for-calculators';
        this.traceType = BlockchainTrTraces.getTypeVoteForCalculatorNodes();
    }
    getFromToAndMemo(actionData) {
        return {
            from: actionData.voter,
            memo: '',
            to: null,
        };
    }
    getTraceThumbnail(actionData) {
        return {
            calculators: actionData.calculators,
        };
    }
}
module.exports = VoteForCalculatorsTraceProcessor;
