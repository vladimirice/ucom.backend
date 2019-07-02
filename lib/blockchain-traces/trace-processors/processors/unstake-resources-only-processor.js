"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const processor_errors_1 = require("../processor-errors");
const AbstractTracesProcessor = require("../abstract-traces-processor");
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const StakeUnstakeHelper = require("../helpers/stake-unstake-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
class UnstakeResourcesOnlyProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.expectedActionsData = {
            undelegatebw: {
                validationSchema: StakeUnstakeHelper.getUndelegateBwValidationSchema(),
                minNumberOfActions: 1,
                maxNumberOfActions: 2,
            },
        };
        this.traceType = BlockchainTrTraces.getTypeUnstakingRequest();
    }
    getFromToAndMemo(actNameToActionDataArray) {
        const actionData = actNameToActionDataArray.undelegatebw[0];
        return {
            from: actionData.act_data.from,
            memo: '',
            to: null,
        };
    }
    getTraceThumbnail(actNameToActionDataArray) {
        const response = StakeUnstakeHelper.getEmptyThumbnail();
        const manyActions = actNameToActionDataArray.undelegatebw;
        let cpuQuantity = 0;
        let netQuantity = 0;
        for (const action of manyActions) {
            const givenCpuQuantity = BalancesHelper.getTokensAmountFromString(action.act_data.unstake_cpu_quantity, symbols_dictionary_1.UOS);
            const givenNetQuantity = BalancesHelper.getTokensAmountFromString(action.act_data.unstake_net_quantity, symbols_dictionary_1.UOS);
            if (givenCpuQuantity !== 0) {
                if (cpuQuantity !== 0) {
                    throw new processor_errors_1.MalformedProcessingError('There is more than one stake cpu action inside a trace');
                }
                cpuQuantity = givenCpuQuantity;
            }
            if (givenNetQuantity !== 0) {
                if (netQuantity !== 0) {
                    throw new processor_errors_1.MalformedProcessingError('There is more than one stake net action inside a trace');
                }
                netQuantity = givenNetQuantity;
            }
        }
        if (cpuQuantity === 0 && netQuantity === 0) {
            throw new processor_errors_1.MalformedProcessingError('Both CPU and NET quantities are zero but at least one of them must be > 0');
        }
        response.resources.cpu.unstaking_request.amount = cpuQuantity;
        response.resources.net.unstaking_request.amount = netQuantity;
        return response;
    }
}
module.exports = UnstakeResourcesOnlyProcessor;
