/* eslint-disable no-console */
const { WalletApi, TransactionSender } = require('ucom-libs-wallet');

const EosApi = require('../../../lib/eos/eosApi');

async function printCurrentBalances(accountName: string) {
  const holderUosTestAfter = await WalletApi.getAccountBalance(accountName, 'UOSTEST');
  const holderGhTestAfter = await WalletApi.getAccountBalance(accountName, 'GHTEST');
  console.log(`${accountName} balance: ${holderUosTestAfter} UOSTEST, ${holderGhTestAfter} GHTEST`);
}

(async () => {
  WalletApi.setNodeJsEnv();
  WalletApi.initForProductionEnv();

  const accountNameFrom = EosApi.getGithubAirdropHolderAccountName();
  const privateKey = EosApi.getGithubAirdropHolderActivePrivateKey();

  const accountNameTo = EosApi.getGithubAirdropAccountName();

  await printCurrentBalances(accountNameFrom);
  await printCurrentBalances(accountNameTo);

  const amount = 1;

  await TransactionSender.sendTokens(
    accountNameFrom,
    privateKey,
    accountNameTo,
    amount,
    '',
    'UOSTEST',
  );

  await TransactionSender.sendTokens(
    accountNameFrom,
    privateKey,
    accountNameTo,
    amount,
    '',
    'GHTEST',
  );

  await printCurrentBalances(accountNameFrom);
  await printCurrentBalances(accountNameTo);
})();

export {};
