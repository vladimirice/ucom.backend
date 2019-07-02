"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const processor_errors_1 = require("../processor-errors");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const TransferUosHelper = require("./transfer-uos-helper");
class BuySellRamHelper {
    static getRamPriceAndFee(actionData, traceType) {
        const response = {
            ramPrice: 0,
            ramFee: 0,
        };
        const inlineTraces = actionData.inline_traces;
        if (inlineTraces.length !== 2) {
            throw new processor_errors_1.MalformedProcessingError('inlineTraces.length !== 2');
        }
        response.ramPrice = this.getRamPrice(inlineTraces, traceType);
        response.ramFee = this.getRamFee(inlineTraces);
        return response;
    }
    static getThumbnail(bytes, tokensAmount) {
        return {
            resources: {
                ram: {
                    dimension: 'kB',
                    amount: +(bytes / 1024).toFixed(4),
                    tokens: {
                        amount: +(tokensAmount).toFixed(4),
                        currency: symbols_dictionary_1.UOS,
                    },
                },
            },
        };
    }
    static getRamPrice(inlineTraces, traceType) {
        const traceTypeToMemo = {
            [BlockchainTrTraces.getTypeBuyRamBytes()]: 'buy ram',
            [BlockchainTrTraces.getTypeSellRam()]: 'sell ram',
        };
        const memo = traceTypeToMemo[traceType];
        if (!memo) {
            throw new TypeError(`Unsupported trace type: ${traceType}`);
        }
        const trace = inlineTraces.find(item => item.act.name === 'transfer' && item.act_data.memo === memo);
        if (!trace) {
            throw new processor_errors_1.MalformedProcessingError('There is no ramPriceTrace');
        }
        TransferUosHelper.validateTraceActDataOrMalformed(trace);
        return BalancesHelper.getTokensAmountFromString(trace.act_data.quantity, symbols_dictionary_1.UOS);
    }
    static getRamFee(inlineTraces) {
        const trace = inlineTraces.find(item => item.act.name === 'transfer' && item.act_data.to === 'eosio.ramfee');
        if (!trace) {
            throw new processor_errors_1.MalformedProcessingError('There is no ramFeeTrace');
        }
        TransferUosHelper.validateTraceActDataOrMalformed(trace);
        return BalancesHelper.getTokensAmountFromString(trace.act_data.quantity, symbols_dictionary_1.UOS);
    }
}
module.exports = BuySellRamHelper;
