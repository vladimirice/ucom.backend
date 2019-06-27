import { diContainer } from '../../../config/inversify/inversify.config';
import { BlockchainTracesDiTypes } from '../../../lib/blockchain-traces/interfaces/di-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import MongoIrreversibleTracesGenerator = require('../../generators/blockchain/irreversible_traces/mongo-irreversible-traces-generator');
import BlockchainHelper = require('../helpers/blockchain-helper');
import RequestHelper = require('../helpers/request-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainTracesSyncService = require('../../../lib/blockchain-traces/service/blockchain-traces-sync-service');

import IrreversibleTracesChecker = require('../../helpers/blockchain/irreversible-traces/irreversible-traces-checker');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

const delay = require('delay');
// eslint-disable-next-line node/no-missing-require,node/no-missing-require
const helpers = require('../helpers');

// eslint-disable-next-line node/no-missing-require
const gen     = require('../../generators');

const blockchainTrTracesService =
  require('../../../lib/eos/service/tr-traces-service/blockchain-tr-traces-service');

const blockchainTrTracesDictionary  =
  // eslint-disable-next-line import/order
  require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

helpers.Mock.mockAllBlockchainPart();
helpers.Mock.mockAllTransactionSigning();

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 40000;

describe('Blockchain tr traces sync tests', () => {
  beforeAll(async () => { await SeedsHelper.noGraphQlMockAllWorkers(); });
  afterAll(async () => { await SeedsHelper.afterAllWithoutGraphQl(); });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  }, JEST_TIMEOUT);

  describe('irreversible transaction traces', () => {
    let traces;
    beforeEach(async () => {
      await MongoIrreversibleTracesGenerator.insertAllSampleTraces(userVlad, userJane);

      const syncService: BlockchainTracesSyncService
        = diContainer.get(BlockchainTracesDiTypes.blockchainTracesSyncService);

      await syncService.process();

      traces = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);
    }, JEST_TIMEOUT);

    describe('check traces', () => {
      it('validate a tokens transfer traces - from and to', async () => {
        const transferTraceFrom = traces.find(item => item.tr_type === BlockchainTrTraces.getLabelTransferFrom());
        IrreversibleTracesChecker.checkUosTransferFrom(transferTraceFrom, userJane);

        const transferTraceTo = traces.find(item => item.tr_type === BlockchainTrTraces.getLabelTransferTo());
        IrreversibleTracesChecker.checkUosTransferTo(transferTraceTo, userJane);

        const foreignTraces = traces.filter(item => item.tr_type === BlockchainTrTraces.getLabelTransferForeign());
        expect(foreignTraces.length).toBe(2);

        foreignTraces.forEach(item => IrreversibleTracesChecker.checkUosTransferForeign(item));
      });

      describe('Voting', () => {
        it('vote and unvote block producers', async () => {
          const votingTraces = traces.filter(item => item.tr_type === BlockchainTrTraces.getTypeVoteForBp());
          expect(votingTraces.length).toBe(2);

          const votingForTrace = votingTraces.find(item => item.producers.length > 0);
          const revokingTrace = votingTraces.find(item => item.producers.length === 0);

          const producers = MongoIrreversibleTracesGenerator.getSampleBlockProducers();

          IrreversibleTracesChecker.checkVoteForBps(votingForTrace, producers);
          IrreversibleTracesChecker.checkVoteForBps(revokingTrace, []);
        });

        it('vote and unvote for calculators', async () => {
          const votingTraces = traces.filter(item => item.tr_type === BlockchainTrTraces.getTypeVoteForCalculatorNodes());
          expect(votingTraces.length).toBe(2);

          const votingForTrace = votingTraces.find(item => item.producers.length > 0);
          const revokingTrace = votingTraces.find(item => item.producers.length === 0);

          const calculators = MongoIrreversibleTracesGenerator.getCalculators();

          IrreversibleTracesChecker.checkVoteForCalculators(votingForTrace, calculators);
          IrreversibleTracesChecker.checkVoteForCalculators(revokingTrace, []);
        });
      });
    });

    it('just save unknown transaction to database without any processing', async () => {
      // TODO
    });

    it('sync a new portion of data - from last saved block', async () => {
      // TODO
    });
  });

  describe('Smoke test', () => {
    it('Smoke test', async () => {
      const queryString = RequestHelper.getPaginationQueryString(1, 10);
      await BlockchainHelper.requestToGetMyselfBlockchainTraces(
        userVlad,
        200,
        queryString,
        true,
      );
    }, JEST_TIMEOUT);
  });

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('check sync', () => {
    it.skip('Check stakeResources sync and fetch', async () => {
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

      const trType = blockchainTrTracesDictionary.getTypeStakeResources();

      await blockchainTrTracesService.syncMongoDbAndPostgres(
        [trType],
        [netSeparatedTr, cpuSeparatedTr, bothTr],
      );

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
        userVlad,
        200,
        queryString,
      );

      expect(models.length).toBe(3);

      let checked = 0;
      models.forEach((model) => {
        if (model.raw_tr_data.id === netSeparatedTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(netAmountSeparated);
          expect(model.resources.cpu.tokens.self_delegated).toBe(0);
          checked += 1;
        } else if (model.raw_tr_data.id === cpuSeparatedTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(0);
          expect(model.resources.cpu.tokens.self_delegated).toBe(cpuAmountSeparated);
          checked += 1;
        } else if (model.raw_tr_data.id === bothTr) {
          expect(model.resources.net.tokens.self_delegated).toBe(netAmountBoth);
          expect(model.resources.cpu.tokens.self_delegated).toBe(cpuAmountBoth);
          checked += 1;
        }
      });

      expect(checked).toBe(3);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    }, JEST_TIMEOUT);

    it.skip('Check TR_TYPE_STAKE_WITH_UNSTAKE sync and fetch', async () => {
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

      const trType = blockchainTrTracesDictionary.getTypeStakeWithUnstake();
      await blockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
        userVlad,
        200,
        queryString,
      );
      expect(models.length).toBe(2);

      let checked = 0;
      models.forEach((model) => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.resources.cpu.tokens.self_delegated).toBe(trOneCpu);
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(trOneNet));
          checked += 1;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.resources.net.tokens.self_delegated).toBe(trTwoNet);
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(trTwoCpu));
          checked += 1;
        }
      });

      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    },      JEST_TIMEOUT);

    it.skip('Check TR_TYPE_UNSTAKING_REQUEST sync and fetch', async () => {
      const trType = blockchainTrTracesDictionary.getTypeUnstakingRequest();

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

      await blockchainTrTracesService.syncMongoDbAndPostgres(
        [trType],
        [netSeparatedTr, cpuSeparatedTr, bothTr],
      );

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
        userVlad,
        200,
        queryString,
      );

      expect(models.length).toBe(3);

      let checked = 0;
      models.forEach((model) => {
        if (model.raw_tr_data.id === netSeparatedTr) {
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(netAmountSeparated));
          expect(model.resources.cpu.unstaking_request.amount).toBe(0);
          checked += 1;
        } else if (model.raw_tr_data.id === cpuSeparatedTr) {
          expect(model.resources.net.unstaking_request.amount).toBe(0);
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(cpuAmountSeparated));
          checked += 1;
        } else if (model.raw_tr_data.id === bothTr) {
          expect(model.resources.net.unstaking_request.amount).toBe(Math.abs(netAmountBoth));
          expect(model.resources.cpu.unstaking_request.amount).toBe(Math.abs(cpuAmountBoth));
          checked += 1;
        }
      });

      expect(checked).toBe(3);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    },      JEST_TIMEOUT);

    it.skip('Check typeTransfer sync and fetch', async () => {
      const vladToJaneAmount = 2;
      const janeToVladAmount = 3;

      const [trOne, trTwo] = await Promise.all([
        gen.BlockchainTr.createTokenTransfer('vlad', 'jane', vladToJaneAmount),
        gen.BlockchainTr.createTokenTransfer('jane', 'vlad', janeToVladAmount),
      ]);

      delay(1000); // approximate lag of mining

      const trType = blockchainTrTracesDictionary.getTypeTransfer();
      await blockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
        userVlad,
        200,
        queryString,
      );
      expect(models.length).toBe(2);

      let checked = 0;
      models.forEach((model) => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.tokens.active).toBe(vladToJaneAmount);
          checked += 1;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.tokens.active).toBe(janeToVladAmount);
          checked += 1;
        }
      });
      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    },      JEST_TIMEOUT);

    it.skip('Check voteForBP sync and fetch', async () => {
      const producersList = helpers.Blockchain.getBlockProducersList();

      const userAlias = 'vlad';

      const producers = [
        producersList[0],
        producersList[1],
      ];

      const [trOne, trTwo] = await Promise.all([
        gen.BlockchainTr.createVoteForBp(userAlias, producers),
        gen.BlockchainTr.createVoteForBp(userAlias, []),
      ]);

      delay(5000); // approximate lag of mining

      const trType = blockchainTrTracesDictionary.getTypeVoteForBp();

      await blockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne, trTwo]);

      const queryString = helpers.Req.getPaginationQueryString(1, 10);
      const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
        userVlad,
        200,
        queryString,
      );

      expect(models.length).toBe(2);

      let checked = 0;
      models.forEach((model) => {
        if (model.raw_tr_data.id === trOne) {
          expect(model.producers.length).toBe(producers.length);
          expect(model.producers).toMatchObject(producers);
          checked += 1;
        } else if (model.raw_tr_data.id === trTwo) {
          expect(model.producers.length).toBe(0);
          checked += 1;
        }
      });
      expect(checked).toBe(2);

      helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
    },      JEST_TIMEOUT);
  });

  it.skip('Check TR_TYPE_BUY_RAM sync and fetch', async () => {
    const userAlias = 'vlad';
    const bytesAmount = 1024 * 1024 * 5;

    const trOne = await gen.BlockchainTr.createBuyRam(userAlias, bytesAmount);

    delay(1000); // approximate lag of mining

    const trType = blockchainTrTracesDictionary.getTypeBuyRamBytes();

    await blockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne]);

    const queryString = helpers.Req.getPaginationQueryString(1, 10);
    const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
      userVlad,
      200,
      queryString,
    );

    expect(models.length).toBe(1);

    expect(models[0].resources.ram.amount).toBe(bytesAmount / 1024);
    expect(models[0].resources.ram.tokens.amount).toBeGreaterThan(1);

    helpers.Blockchain.checkMyselfBlockchainTransactionsStructure(models);
  },      JEST_TIMEOUT);

  it.skip('Check TR_TYPE_SELL_RAM sync and fetch', async () => {
    const userAlias = 'vlad';
    const bytesAmount = 1024 * 1024 * 5;

    const trOne = await gen.BlockchainTr.createSellRam(userAlias, bytesAmount);

    delay(1000); // approximate lag of mining

    const trType = blockchainTrTracesDictionary.getTypeSellRam();

    await blockchainTrTracesService.syncMongoDbAndPostgres([trType], [trOne]);

    const queryString = helpers.Req.getPaginationQueryString(1, 10);
    const models = await helpers.Blockchain.requestToGetMyselfBlockchainTraces(
      userVlad,
      200,
      queryString,
    );

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
      // Because blockchain source (mongoDb) is not mocked yet
      // it is not possible to properly imitate
      // claim emission without any hardcode.
      // This autotest is skipped
    });
    it.skip('Check TR_TYPE_MYSELF_REGISTRATION sync and fetch', async () => {
    });
  });
});

export {};
