"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BalancesHelper = require("../../../common/helper/blockchain/balances-helper");
const EosApi = require("../../../eos/eosApi");
const winston_1 = require("../../../../config/winston");
const CurrencyHelper = require("../../../common/helper/CurrencyHelper");
const WorkerHelper = require("../../../common/helper/worker-helper");
const options = {
    processName: 'airdrops-balances-monitoring',
    durationInSecondsToAlert: 50,
};
const executionOptions = {
    alertLimit: 1000000,
    uosHolderBalance: 8999998 - 100,
};
function triggerTooLowAlertIfRequired(balance, symbol) {
    if (balance >= executionOptions.alertLimit) {
        return;
    }
    winston_1.WorkerLogger.error('UOS airdrop balance too low alert', {
        service: 'airdrops-balances-monitoring',
        current_balance: CurrencyHelper.getHumanReadableNumber(balance),
        symbol: symbol,
        alert_limit: CurrencyHelper.getHumanReadableNumber(executionOptions.alertLimit),
    });
    console.error('Alert is triggered');
}
function triggerBalanceIsChangedAlertIfRequired(balance, symbol) {
    if (balance === executionOptions.uosHolderBalance) {
        return;
    }
    winston_1.WorkerLogger.error('UOS holder balance is changed alert', {
        service: 'airdrops-balances-monitoring',
        current_balance: CurrencyHelper.getHumanReadableNumber(balance),
        symbol: symbol,
        required_balance: CurrencyHelper.getHumanReadableNumber(executionOptions.uosHolderBalance),
        difference: CurrencyHelper.getHumanReadableNumber(balance - executionOptions.uosHolderBalance),
    });
    console.error('Alert is triggered');
}
async function toExecute() {
    const accountNameAirdrop = EosApi.getGithubAirdropAccountName();
    const accountNameHolder = EosApi.getGithubAirdropHolderAccountName();
    const manySymbols = [
        'UOS',
        'UOSF'
    ];
    EosApi.initBlockchainLibraries();
    for (const symbol of manySymbols) {
        const balance = await BalancesHelper.getOneBalanceInMajor(accountNameAirdrop, symbol);
        triggerTooLowAlertIfRequired(balance, symbol);
    }
    for (const symbol of manySymbols) {
        const balance = await BalancesHelper.getOneBalanceInMajor(accountNameHolder, symbol);
        triggerBalanceIsChangedAlertIfRequired(balance, symbol);
    }
}
(async () => {
    await WorkerHelper.process(toExecute, options);
})();
