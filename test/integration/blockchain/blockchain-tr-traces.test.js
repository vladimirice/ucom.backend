const helpers = require('../helpers');
const gen     = require('../../generators');

const delay = require('delay');

const BlockchainTrTracesService     = require('../../../lib/eos/service/tr-traces-service/blockchain-tr-traces-service');
const BlockchainTrTracesDictionary  = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

let userVlad, userJane, userPetr, userRokky;

const JEST_TIMEOUT = 40000;

describe('Blockchain tr traces sync tests', () => {
  afterAll(async () => {
    await helpers.SeedsHelper.sequelizeAfterAll();
  });

  beforeEach(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  describe('check sync', function () {
    it('Check stakeResources sync and fetch', async () => {
      const accountAlias = 'vlad';

      const netAmountSeparated = 2;
      const cpuAmountSeparated = 3;

      const netAmountBoth = 4;
      const cpuAmountBoth = 5;

      const [netSeparatedTr, cpuSeparatedTr, bothTr] = await Promise.all([
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, netAmountSeparated, 0),
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, 0, cpuAmountSeparated),
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, netAmountBoth, cpuAmountBoth),
      ]);

      delay(1000); // approximate lag of mining

      const trType = BlockchainTrTracesDictionary.getTypeStakeResources();

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [netSeparatedTr, cpuSeparatedTr, bothTr]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

      expect(models.length).toBe(3);

      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === netSeparatedTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(netAmountSeparated);
          expect(model.resources.cpu.tokens.self_delegated).toBe(0);
          checked++;
        } else if (model.raw_tr_data.id === cpuSeparatedTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(0);
          expect(model.resources.cpu.tokens.self_delegated).toBe(cpuAmountSeparated);
          checked++;
        } else if (model.raw_tr_data.id === bothTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(netAmountBoth);
          expect(model.resources.cpu.tokens.self_delegated).toBe(cpuAmountBoth);
          checked++;
        }
      });

      expect(checked).toBe(3);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

    }, JEST_TIMEOUT);

    it('Check TR_TYPE_STAKE_WITH_UNSTAKE sync and fetch', async () => {
      const userAlias = 'vlad';

      const trOneNet = -1;
      const trOneCpu = 4;

      const trTwoNet = 3;
      const trTwoCpu = -2;

      const [trOne, trTwo] = await Promise.all([
        gen.BlockchainTr.createStakeOrUnstake(userAlias, trOneNet, trOneCpu),
        gen.BlockchainTr.createStakeOrUnstake(userAlias, trTwoNet, trTwoCpu),
      ]);

      delay(1000); // approximate lag of mining

      const trType = BlockchainTrTracesDictionary.getTypeStakeWithUnstake();
      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);


      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(2);


      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.resources.cpu.tokens.self_delegated).toBe(trOneCpu);
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(trOneNet));
          checked++;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.resources.net.tokens.self_delegated).toBe(trTwoNet);
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(trTwoCpu));
          checked++;
        }
      });

      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    }, JEST_TIMEOUT);

    it('Check TR_TYPE_UNSTAKING_REQUEST sync and fetch', async () => {
      const trType = BlockchainTrTracesDictionary.getTypeUnstakingRequest();

      const accountAlias = 'vlad';

      const netAmountSeparated = -2;
      const cpuAmountSeparated = -3;

      const netAmountBoth = -1;
      const cpuAmountBoth = -2;

      const [netSeparatedTr, cpuSeparatedTr, bothTr] = await Promise.all([
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, netAmountSeparated, 0),
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, 0, cpuAmountSeparated),
        gen.BlockchainTr.createStakeOrUnstake(accountAlias, netAmountBoth, cpuAmountBoth),
      ]);

      delay(1000); // approximate lag of mining

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [netSeparatedTr, cpuSeparatedTr, bothTr]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

      expect(models.length).toBe(3);

      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === netSeparatedTr) {
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(netAmountSeparated));
          expect(model.resources.cpu.unstaking_request.amount).toBe(0);
          checked++;
        } else if (model.raw_tr_data.id === cpuSeparatedTr) {
          expect(model.resources.net.unstaking_request.amount).toBe(0);
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(cpuAmountSeparated));
          checked++;
        } else if (model.raw_tr_data.id === bothTr) {
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(netAmountBoth));
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(cpuAmountBoth));
          checked++;
        }
      });

      expect(checked).toBe(3);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    }, JEST_TIMEOUT);

    it('Check typeTransfer sync and fetch', async () => {
      const vladToJaneAmount = 2;
      const janeToVladAmount = 3;

      const [trOne, trTwo] = await Promise.all([
        gen.BlockchainTr.createTokenTransfer('vlad', 'jane', vladToJaneAmount),
        gen.BlockchainTr.createTokenTransfer('jane', 'vlad', janeToVladAmount)
      ]);

      delay(1000); // approximate lag of mining

      const trType = BlockchainTrTracesDictionary.getTypeTransfer();
      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);
      expect(models.length).toBe(2);

      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.tokens.active).toBe(vladToJaneAmount);
          checked++;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.tokens.active).toBe(janeToVladAmount);
          checked++;
        }
      });
      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    }, JEST_TIMEOUT);

    it('Check voteForBP sync and fetch', async () => {

      const producersList = helpers.Blockchain.getBlockProducersList();

      const userAlias = 'vlad';

      const producers = [
        producersList[0],
        producersList[1]
      ];

      const [trOne, trTwo] = await Promise.all([
        gen.BlockchainTr.createVoteForBp(userAlias, producers),
        gen.BlockchainTr.createVoteForBp(userAlias, []),
      ]);

      delay(1000); // approximate lag of mining

      const trType = BlockchainTrTracesDictionary.getTypeVoteForBp();

      await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

      expect(models.length).toBe(2);

      let checked = 0;
      models.forEach(model => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.producers.length).toBe(producers.length);
          expect(model.producers).toMatchObject(producers);
          checked++;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.producers.length).toBe(0);
          checked++;
        }
      });
      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

    }, JEST_TIMEOUT);
  });

  it('Check TR_TYPE_BUY_RAM sync and fetch', async () => {
    const userAlias = 'vlad';
    const bytesAmount = 1024 * 1024 * 5;

    const trOne = await gen.BlockchainTr.createBuyRam(userAlias, bytesAmount);

    delay(1000); // approximate lag of mining

    const trType = BlockchainTrTracesDictionary.getTypeBuyRamBytes();

    await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne]);

    const queryString = helpers.Req.getPaginationQueryString(1, 10);
    const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

    expect(models.length).toBe(1);

    expect(models[0].resources.ram.amount).toBe(bytesAmount / 1024);
    expect(models[0].resources.ram.tokens.amount).toBeGreaterThan(1);

    helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

  }, JEST_TIMEOUT);

  it('Check TR_TYPE_SELL_RAM sync and fetch', async () => {
    const userAlias = 'vlad';
    const bytesAmount = 1024 * 1024 * 5;

    const trOne = await gen.BlockchainTr.createSellRam(userAlias, bytesAmount);

    delay(1000); // approximate lag of mining

    const trType = BlockchainTrTracesDictionary.getTypeSellRam();

    await BlockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne]);

    const queryString = helpers.Req.getPaginationQueryString(1, 10);
    const models = await helpers.Blockchain.requestToGetMyselfBlockchainTransactions(userVlad, 200, queryString);

    expect(models.length).toBe(1);

    expect(models[0].resources.ram.amount).toBe(bytesAmount / 1024);
    expect(models[0].resources.ram.tokens.amount).toBeGreaterThan(1);

    helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);

  }, JEST_TIMEOUT);

  describe('Skipped autotests', () => {
    it.skip('test real tr block data from blockchain', async () => {
      // now there is a mockup inside blockchain tr traces processor for test environment
      // because block might be created only after several seconds passed
    });

    it.skip('send transaction, sync and observe it inside Db', async () => {
      // fetch last transaction for every tested set of data
      // Send transactions via wallet
      // sync tr-traces
      // Find transactions which is sent
    });
    it.skip('Fetch raw_tr_data for every transaction type and check it structure', async () => {
      // There are parts of raw response which is changed from transaction to transaction
      // elapsed, external_id, etc. It is required not to check them or create mock source
    });
    it.skip('Check TR_TYPE_CLAIM_EMISSION sync and fetch', async () => {
      // Because blockchain source (mongoDb) is not mocked yet - it is not possible to properly imitate
      // claim emission without any hardcode.
      // This autotest is skipped
    });
    it.skip('Check TR_TYPE_MYSELF_REGISTRATION sync and fetch', async () => {
    });
  });
});