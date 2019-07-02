import { diContainer } from '../../../config/inversify/inversify.config';
import { BlockchainTracesDiTypes } from '../../../lib/blockchain-traces/interfaces/di-interfaces';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import MongoIrreversibleTracesGenerator = require('../../generators/blockchain/irreversible_traces/mongo-irreversible-traces-generator');
import BlockchainHelper = require('../helpers/blockchain-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainTracesSyncService = require('../../../lib/blockchain-traces/service/blockchain-traces-sync-service');

import IrreversibleTracesChecker = require('../../helpers/blockchain/irreversible-traces/irreversible-traces-checker');
import BlockchainModelProvider = require('../../../lib/eos/service/blockchain-model-provider');
import knex = require('../../../config/knex');

const { BlockchainTrTraces }  = require('ucom-libs-wallet').Dictionary;

let userVlad: UserModel;
let userJane: UserModel;

const JEST_TIMEOUT = 5000;

describe('Blockchain tr traces sync tests', () => {
  beforeAll(async () => { await SeedsHelper.noGraphQlMockAllWorkers(); });
  afterAll(async () => { await SeedsHelper.afterAllWithoutGraphQl(); });

  beforeEach(async () => {
    [userVlad, userJane] = await SeedsHelper.beforeAllRoutine();
  }, JEST_TIMEOUT);

  describe('irreversible transaction traces', () => {
    describe('sync logic', () => {
      it('sync a new portion of data - from last saved block', async () => {
        const { unique } = await MongoIrreversibleTracesGenerator.insertAllSampleTraces(userVlad, userJane);
        const onlyOneBatch = true;

        const syncService: BlockchainTracesSyncService
          = diContainer.get(BlockchainTracesDiTypes.blockchainTracesSyncService);

        await syncService.process(5, onlyOneBatch);
        await syncService.process(unique + 5, onlyOneBatch);

        const traces = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);

        expect(traces.length).toBe(unique);
      });

      it('process batch by batch correctly', async () => {
        const { unique } = await MongoIrreversibleTracesGenerator.insertAllSampleTraces(userVlad, userJane);

        const syncService: BlockchainTracesSyncService
          = diContainer.get(BlockchainTracesDiTypes.blockchainTracesSyncService);

        await syncService.process(5);

        const traces = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);

        expect(traces.length).toBe(unique);
      });

      it('resync by adding not existing ones', async () => {
        const { unique } = await MongoIrreversibleTracesGenerator.insertAllSampleTraces(userVlad, userJane);
        const syncService: BlockchainTracesSyncService
          = diContainer.get(BlockchainTracesDiTypes.blockchainTracesSyncService);

        await syncService.process();

        const deleted = await knex(BlockchainModelProvider.irreversibleTracesTableName())
          .delete()
          .where({
            tr_type: BlockchainTrTraces.getTypeStakeResources(),
          }).returning('id');

        const tracesBefore = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);

        expect(tracesBefore.length).toBe(unique - deleted.length);

        await syncService.process();
        const tracesNoChanges = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);

        expect(tracesNoChanges.length).toBe(unique - deleted.length);

        const batchSize = 100;
        const onlyOneBatch = false;
        const resync = true;

        await syncService.process(batchSize, onlyOneBatch, resync);
        const allTracesAgain = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);

        expect(allTracesAgain.length).toBe(unique);
      }, JEST_TIMEOUT);
    });

    describe('check traces', () => {
      let traces;
      beforeEach(async () => {
        await MongoIrreversibleTracesGenerator.insertAllSampleTraces(userVlad, userJane);

        const syncService: BlockchainTracesSyncService
          = diContainer.get(BlockchainTracesDiTypes.blockchainTracesSyncService);

        await syncService.process();

        traces = await BlockchainHelper.requestToGetMyselfBlockchainTraces(userVlad);
      }, JEST_TIMEOUT);

      it('check emission trace', async () => {
        const emissionTraces = traces.filter(item => item.tr_type === BlockchainTrTraces.getTypeClaimEmission());

        expect(emissionTraces.length).toBe(1);
        const emissionTrace = emissionTraces[0];

        IrreversibleTracesChecker.checkEmission(emissionTrace);
      });
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

            expect(trace.resources.cpu.tokens.self_delegated).toBe(0);
            expect(trace.resources.net.tokens.self_delegated).toBe(0);
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
          const trType: number = BlockchainTrTraces.getTypeStakeWithUnstake();

          const stakingTraces = traces.filter(item => item.tr_type === trType);
          expect(stakingTraces.length).toBe(1);

          const oneTrace = stakingTraces[0];
          IrreversibleTracesChecker.checkStakeUnstakeStructure(oneTrace, trType);

          const { net } = oneTrace.resources;
          const { cpu } = oneTrace.resources;

          expect(net.unstaking_request.amount)
            .toBe(MongoIrreversibleTracesGenerator.getSampleUnstakeNetQuantity());
          expect(net.tokens.self_delegated).toBe(0);

          expect(cpu.tokens.self_delegated)
            .toBe(MongoIrreversibleTracesGenerator.getSampleStakeCpuQuantity());
          expect(cpu.unstaking_request.amount).toBe(0);
        });
      });
      describe('RAM traces', () => {
        it('buy RAM bytes', async () => {
          const expectedBytes: number = MongoIrreversibleTracesGenerator.getRamBytesToBuy();
          const expectedUos: number = MongoIrreversibleTracesGenerator.getBuyRamBytesUos()
            + MongoIrreversibleTracesGenerator.getBuyRamBytesUosFee();

          const trType: number = BlockchainTrTraces.getTypeBuyRamBytes();

          const targetTraces = traces.filter(item => item.tr_type === trType);
          expect(targetTraces.length).toBe(1);

          const oneTrace = targetTraces[0];
          IrreversibleTracesChecker.checkBuySellRamTrace(
            oneTrace,
            trType,
            expectedBytes,
            expectedUos,
          );
        });

        it('sell RAM bytes', async () => {
          const expectedBytes: number = MongoIrreversibleTracesGenerator.getRamBytesToSell();
          const expectedUos: number = MongoIrreversibleTracesGenerator.getSellRamBytesUos()
            - MongoIrreversibleTracesGenerator.getSellRamBytesUosFee();

          const trType: number = BlockchainTrTraces.getTypeSellRam();

          const targetTraces = traces.filter(item => item.tr_type === trType);
          expect(targetTraces.length).toBe(1);

          const oneTrace = targetTraces[0];
          IrreversibleTracesChecker.checkBuySellRamTrace(
            oneTrace,
            trType,
            expectedBytes,
            expectedUos,
          );
        });
      });
    });
  });
});

export {};
