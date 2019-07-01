import { diContainer } from '../../../config/inversify/inversify.config';
import { BlockchainTracesDiTypes } from '../../../lib/blockchain-traces/interfaces/di-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import MongoIrreversibleTracesGenerator = require('../../generators/blockchain/irreversible_traces/mongo-irreversible-traces-generator');
import BlockchainHelper = require('../helpers/blockchain-helper');
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

          const votingForTrace = votingTraces.find(item => item.calculators.length > 0);
          const revokingTrace = votingTraces.find(item => item.calculators.length === 0);

          const calculators = MongoIrreversibleTracesGenerator.getCalculators();

          IrreversibleTracesChecker.checkVoteForCalculators(votingForTrace, calculators);
          IrreversibleTracesChecker.checkVoteForCalculators(revokingTrace, []);
        });
      });
      describe('Staking and unstaking', () => {
        it('Staking only traces', async () => {
          const trType: number = BlockchainTrTraces.getTypeStakeResources();

          const stakingTraces = traces.filter(item => item.tr_type === trType);
          expect(stakingTraces.length).toBe(3);

          for (const trace of stakingTraces) {
            IrreversibleTracesChecker.checkStakeUnstakeStructure(trace, trType);

            expect(trace.resources.cpu.unstaking_request.amount).toBe(0);
            expect(trace.resources.net.unstaking_request.amount).toBe(0);
          }

          const stakeCpuOnly = stakingTraces.some(
            item => item.resources.cpu.tokens.self_delegated === MongoIrreversibleTracesGenerator.getSampleStakeCpuQuantity()
            && item.resources.net.tokens.self_delegated === 0,
          );
          expect(stakeCpuOnly).toBe(true);

          const stakeNetOnly = stakingTraces.some(
            item => item.resources.net.tokens.self_delegated === MongoIrreversibleTracesGenerator.getSampleStakeNetQuantity()
            && item.resources.cpu.tokens.self_delegated === 0,
          );

          expect(stakeNetOnly).toBe(true);

          const stakeBothCpuAndNet = stakingTraces.some(
            item => item.resources.net.tokens.self_delegated === MongoIrreversibleTracesGenerator.getSampleStakeNetQuantity()
                 && item.resources.cpu.tokens.self_delegated === MongoIrreversibleTracesGenerator.getSampleStakeCpuQuantity(),
          );

          expect(stakeBothCpuAndNet).toBe(true);
        });

        it('Unstaking only traces', async () => {
          const trType: number = BlockchainTrTraces.getTypeUnstakingRequest();

          const stakingTraces = traces.filter(item => item.tr_type === trType);
          expect(stakingTraces.length).toBe(3);

          for (const trace of stakingTraces) {
            IrreversibleTracesChecker.checkStakeUnstakeStructure(trace, trType);

            expect(trace.resources.cpu.self_delegated.amount).toBe(0);
            expect(trace.resources.net.self_delegated.amount).toBe(0);
          }

          const unstakeCpuOnly = stakingTraces.some(
            item => item.resources.cpu.unstaking_request.amount === MongoIrreversibleTracesGenerator.getSampleUnstakeCpuQuantity()
              && item.resources.net.unstaking_request.amount === 0,
          );
          expect(unstakeCpuOnly).toBe(true);

          const unstakeNetOnly = stakingTraces.some(
            item => item.resources.net.unstaking_request.amount === MongoIrreversibleTracesGenerator.getSampleUnstakeNetQuantity()
              && item.resources.cpu.unstaking_request.amount === 0,
          );

          expect(unstakeNetOnly).toBe(true);

          const unstakeBothCpuAndNet = stakingTraces.some(
            item => item.resources.net.unstaking_request.amount === MongoIrreversibleTracesGenerator.getSampleUnstakeNetQuantity()
              && item.resources.cpu.unstaking_request.amount === MongoIrreversibleTracesGenerator.getSampleUnstakeCpuQuantity(),
          );

          expect(unstakeBothCpuAndNet).toBe(true);
        });

        it('Unstake CPU but stake NET', async () => {
          // TODO
          /*

          getTypeStakeWithUnstake

          actions.length = 2
            response {
              full structure stake + unstake.
            }

            one action  - delegate
            another     - undelegate
           */
          // TODO
        });
      });
      describe('RAM traces', () => {
        it('buy RAM bytes', async () => {
          // TODO
          /*
            actions.length = 1
            getTypeBuyRamBytes

            act = buyrambytes

          act_data : {
            payer : actor.account_name,
            receiver : actor.account_name,
            bytes : 100024,
          },

          inline_traces.length = 2

          first inline trace - actual price

          act name = 'transfer'
          act_data : {
            from : actor.account_name,
            to : 'eosio.ram',
            quantity : '5.0486 UOS',
            memo : 'buy ram',
          },

          second inline trace commission
          act name = 'transfer'

          act_data : {
            from : actor.account_name,
            to : 'eosio.ramfee',
            quantity : '0.0254 UOS',
            memo : 'ram fee',
          },

          ----------------------
          response:

          resources {
            ram: {
              amount: 100500,
              dimension: "kB",
              tokens: {
                amount: 100,
                currency: 'UOS',
              }
            }
          }
           */
        });

        it('sell RAM bytes', async () => {
          // TODO
          /*
          actions.length = 1
          getTypeSellRam

          act name = sellram

          act_data : {
            account : actor.account_name,
            bytes : 100001,
          },

          ---------------------------

          inline_traces.length = 2

          first inline trace
          act name transfer

          act_data : {
            from : 'eosio.ram',
            to : actor.account_name,
            quantity : '5.0729 UOS',
            memo : 'sell ram',
          },

          ---------------------------

          second inline trace
          act name transfer

          act_data : {
            from : actor.account_name,
            to : 'eosio.ramfee',
            quantity : '0.0254 UOS',
            memo : 'sell ram fee',
          },


          ===========================

          resources {
            ram: {
              amount: 100500,
              dimension: "kB",
              tokens: {
                amount: 100,
                currency: 'UOS',
              }
            }
          }
       */
        });
      });
    });

    it('check emission trace', async () => {
      const emissionTraces = traces.filter(item => item.tr_type === BlockchainTrTraces.getTypeClaimEmission());

      expect(emissionTraces.length).toBe(1);
      const emissionTrace = emissionTraces[0];

      IrreversibleTracesChecker.checkEmission(emissionTrace);
    });

    it('just save unknown transaction to database without any processing', async () => {
      // Find a social transaction
      // TODO
    });

    it('sync a new portion of data - from last saved block', async () => {
      // Manual testing
      // TODO
    });

    it('catch a duplication - no processing - on conflict do nothing', async () => {
      // Manual testing
      // TODO
    });

    it('process a totally malformed transaction via the unknown processor', async () => {
      // Manual testing
      // TODO
    });
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
    it.skip('Check TR_TYPE_MYSELF_REGISTRATION sync and fetch', async () => {});
    it.skip('Check all social transactions', async () => {});
  });
});

export {};
