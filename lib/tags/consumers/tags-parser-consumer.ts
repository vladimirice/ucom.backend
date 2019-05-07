/* eslint-disable no-console,no-process-exit,unicorn/no-process-exit */
import DatetimeHelper = require('../../common/helper/datetime-helper');
import EosApi = require('../../eos/eosApi');
import ConsumerTagsParser = require('../job/consumer-tags-parser');

(async () => {
  EosApi.initBlockchainLibraries();

  const res = await ConsumerTagsParser.consume();
  console.log(
    `${DatetimeHelper.currentDatetime()}. Consumer tags parser is started. Response from start is ${JSON.stringify(res, null, 2)}`,
  );
})();

export {};
