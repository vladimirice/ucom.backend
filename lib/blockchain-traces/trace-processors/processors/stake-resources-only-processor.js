"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const AbstractTracesProcessor = require("../abstract-traces-processor");
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const StakeUnstakeHelper = require("../helpers/stake-unstake-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
class StakeResourcesOnlyProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.expectedActionsData = {
            delegatebw: {
                validationSchema: StakeUnstakeHelper.getDelegateBwValidationSchema(),
                minNumberOfActions: 1,
                maxNumberOfActions: 2,
            },
        };
        this.traceType = BlockchainTrTraces.getTypeStakeResources();
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.delegatebw[0];
        return {
            from: actionData.act_data.from,
            memo: '',
            to: null,
        };
    }
    // @ts-ignore
    getTraceThumbnail(actNameToActionDataArray) {
        const response = StakeUnstakeHelper.getEmptyThumbnail();
        const manyActions = actNameToActionDataArray.delegatebw;
        let cpuQuantity = 0;
        let netQuantity = 0;
        for (const action of manyActions) {
            const givenCpuQuantity = BalancesHelper.getTokensAmountFromString(action.act_data.stake_cpu_quantity, symbols_dictionary_1.UOS);
            const givenNetQuantity = BalancesHelper.getTokensAmountFromString(action.act_data.stake_net_quantity, symbols_dictionary_1.UOS);
            if (givenCpuQuantity !== 0) {
                if (cpuQuantity !== 0) {
                    this.throwMalformedError('There is more than one stake cpu action inside a trace');
                }
                cpuQuantity = givenCpuQuantity;
            }
            if (givenNetQuantity !== 0) {
                if (netQuantity !== 0) {
                    this.throwMalformedError('There is more than one stake net action inside a trace');
                }
                netQuantity = givenNetQuantity;
            }
        }
        if (cpuQuantity === 0 && netQuantity === 0) {
            this.throwMalformedError('Both CPU and NET quantities are zero but at least one of them must be > 0');
        }
        response.resources.cpu.tokens.self_delegated = cpuQuantity;
        response.resources.net.tokens.self_delegated = netQuantity;
        return response;
    }
}
module.exports = StakeResourcesOnlyProcessor;
