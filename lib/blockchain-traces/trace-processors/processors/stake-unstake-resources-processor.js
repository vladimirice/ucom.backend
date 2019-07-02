"use strict";
const symbols_dictionary_1 = require("../../../common/dictionary/symbols-dictionary");
const processor_errors_1 = require("../processor-errors");
const AbstractTracesProcessor = require("../abstract-traces-processor");
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const StakeUnstakeHelper = require("../helpers/stake-unstake-helper");
const { BlockchainTrTraces } = require('ucom-libs-wallet').Dictionary;
class StakeUnstakeResourcesProcessor extends AbstractTracesProcessor {
    constructor() {
        super(...arguments);
        this.expectedActionsData = {
            delegatebw: {
                validationSchema: StakeUnstakeHelper.getDelegateBwValidationSchema(),
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
            undelegatebw: {
                validationSchema: StakeUnstakeHelper.getUndelegateBwValidationSchema(),
                minNumberOfActions: 1,
                maxNumberOfActions: 1,
            },
        };
        this.traceType = BlockchainTrTraces.getTypeStakeWithUnstake();
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
        const unstakeAction = actNameToActionDataArray.undelegatebw[0];
        const unstakeNetQuantity = BalancesHelper.getTokensAmountFromString(unstakeAction.act_data.unstake_net_quantity, symbols_dictionary_1.UOS);
        const unstakeCpuQuantity = BalancesHelper.getTokensAmountFromString(unstakeAction.act_data.unstake_cpu_quantity, symbols_dictionary_1.UOS);
        if (unstakeNetQuantity !== 0 && unstakeCpuQuantity !== 0) {
            throw new processor_errors_1.MalformedProcessingError('Both net and cpu is unstaked in one action. Expected that only one resource per action.');
        }
        response.resources.net.unstaking_request.amount = unstakeNetQuantity;
        response.resources.cpu.unstaking_request.amount = unstakeCpuQuantity;
        const stakeAction = actNameToActionDataArray.delegatebw[0];
        const stakeNetQuantity = BalancesHelper.getTokensAmountFromString(stakeAction.act_data.stake_net_quantity, symbols_dictionary_1.UOS);
        const stakeCpuQuantity = BalancesHelper.getTokensAmountFromString(stakeAction.act_data.stake_cpu_quantity, symbols_dictionary_1.UOS);
        if (stakeNetQuantity !== 0 && stakeCpuQuantity !== 0) {
            throw new processor_errors_1.MalformedProcessingError('Both net and cpu is unstaked in one action. Expected that only one resource per action.');
        }
        response.resources.net.tokens.self_delegated = stakeNetQuantity;
        response.resources.cpu.tokens.self_delegated = stakeCpuQuantity;
        return response;
    }
}
module.exports = StakeUnstakeResourcesProcessor;
