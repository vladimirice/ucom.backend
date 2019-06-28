"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const AbstractTracesProcessor = require("../abstract-traces-processor");
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const joi = require('joi');
class ClaimEmissionTraceProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.actionDataSchema = {
            owner: joi.string().required().min(1).max(12),
        };
        this.expectedActName = 'withdrawal';
        this.expectedActionsLength = 1;
        this.serviceName = 'vote-for-calculators';
        this.traceType = BlockchainTrTraces.getTypeClaimEmission();
    }
    getFromToAndMemo(actionData) {
        return {
            from: actionData.owner,
            memo: '',
            to: null,
        };
    }
    getTraceThumbnail(
    // @ts-ignore
    actionData, trace) {
        // TODO use joi schema and possibly move to the abstract class
        const inlineTraces = trace.actions[0].inline_traces;
        if (inlineTraces.length !== 2) {
            // this is an error
        }
        // fetch first inline trace no matter what
        const transferInlineTrace = inlineTraces.find(item => item.act.name === 'transfer');
        if (!transferInlineTrace) {
            // this is an error
        }
        if (!transferInlineTrace.act_data) {
            // this is an error
        }
        const { quantity } = transferInlineTrace.act_data;
        if (!quantity) { // must be string and contains UOS
            // this is an error
        }
        // act_data : {
        //   from : 'uos.calcs',
        //     to : actor.account_name,
        //     quantity : '1334.8073 UOS',
        //     memo : 'transfer issued tokens for account',
        // },
        return {
            tokens: {
                currency: symbols_dictionary_1.UOS,
                emission: BalancesHelper.getTokensAmountFromString(quantity, symbols_dictionary_1.UOS),
            },
        };
    }
}
module.exports = ClaimEmissionTraceProcessor;
