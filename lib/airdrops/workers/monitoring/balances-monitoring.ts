/* eslint-disable no-console */
import { WorkerLogger } from '../../../../config/winston';
import { WorkerOptionsDto } from '../../../common/interfaces/options-dto';

import BalancesHelper = require('../../../common/helper/blockchain/balances-helper');
import EosApi = require('../../../eos/eosApi');
import CurrencyHelper = require('../../../common/helper/CurrencyHelper');
import WorkerHelper = require('../../../common/helper/worker-helper');

const options: WorkerOptionsDto = {
  processName: 'airdrops-balances-monitoring',
  durationInSecondsToAlert: 50,
};

const executionOptions = {
  alertLimit: 200000,
  uosHolderBalance: 8999998,
};

function triggerTooLowAlertIfRequired(balance: number, symbol: string): void {
  if (balance >= executionOptions.alertLimit) {
    return;
  }

  WorkerLogger.error('UOS airdrop balance too low alert', {
    service: 'airdrops-balances-monitoring',
    current_balance: CurrencyHelper.getHumanReadableNumber(balance),
    symbol,
    alert_limit: CurrencyHelper.getHumanReadableNumber(executionOptions.alertLimit),
  });

  console.error('Alert is triggered');
}

function triggerBalanceIsChangedAlertIfRequired(balance: number, symbol: string): void {
  if (balance === executionOptions.uosHolderBalance) {
    return;
  }

  WorkerLogger.error('UOS holder balance is changed alert', {
    service: 'airdrops-balances-monitoring',
    current_balance: CurrencyHelper.getHumanReadableNumber(balance),
    symbol,
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
    'UOSF',
  ];

  EosApi.initBlockchainLibraries();

  for (const symbol of manySymbols) {
    const balance: number = await BalancesHelper.getOneBalanceInMajor(accountNameAirdrop, symbol);
    triggerTooLowAlertIfRequired(balance, symbol);
  }

  for (const symbol of manySymbols) {
    const balance: number = await BalancesHelper.getOneBalanceInMajor(accountNameHolder, symbol);
    triggerBalanceIsChangedAlertIfRequired(balance, symbol);
  }
}

(async () => {
  await WorkerHelper.process(toExecute, options);
})();


export {};
