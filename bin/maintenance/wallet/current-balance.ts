import BalancesHelper = require('../../../lib/common/helper/blockchain/balances-helper');
import EosApi = require('../../../lib/eos/eosApi');

const yargs = require('yargs');


const { argv } = yargs
  .option('account_name', {
    alias: 'a',
    describe: 'account_name',
    type: 'string',
    demand: true,
  })
  .option('symbol', {
    alias: 's',
    describe: 'symbol',
    type: 'string',
    demand: true,
    default: 'UOS',
  })
  .help()
  .alias('help', 'h');

(async () => {
  EosApi.initBlockchainLibraries();

  const doesExist: boolean = await EosApi.doesAccountExist(argv.account_name);

  if (!doesExist) {
    // eslint-disable-next-line no-console
    console.error(`There is no such account: ${argv.account_name}`);
  } else {
    await BalancesHelper.printManyBalancesOfOneAccount(argv.account_name, [argv.symbol]);
  }
})();
