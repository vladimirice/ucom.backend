/* eslint-disable no-console */
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';
import { WorkerLogger } from '../../../config/winston';
import { TotalParametersResponse } from '../../common/interfaces/response-interfaces';

import MongoExternalModelProvider = require('../../eos/service/mongo-external-model-provider');
import IrreversibleTracesClient = require('../client/irreversible-traces-client');
import TracesCommonFieldsValidator = require('../validator/traces-common-fields-validator');
import BlockchainTracesProcessorChain = require('./blockchain-traces-processor-chain');
import IrreversibleTracesRepository = require('../repository/irreversible-traces-repository');

const _ = require('lodash');

const ACTION_TRACES = MongoExternalModelProvider.actionTracesCollection();

const SERVICE_NAME = 'blockchain-traces-sync';

@injectable()
class BlockchainTracesSyncService {
  private readonly tracesCommonFieldsValidator: TracesCommonFieldsValidator;

  private readonly blockchainTracesProcessorChain: BlockchainTracesProcessorChain;

  public constructor(
    @inject(BlockchainTracesDiTypes.tracesCommonFieldsValidator) tracesCommonFieldsValidator,
    @inject(BlockchainTracesDiTypes.blockchainTracesProcessorChain) blockchainTracesProcessorChain,
  ) {
    this.tracesCommonFieldsValidator    = tracesCommonFieldsValidator;
    this.blockchainTracesProcessorChain = blockchainTracesProcessorChain;
  }

  public async process(
    singleBatchSize: number = 200,
    onlyOneBatch: boolean = false,
    resync: boolean = false,
  ): Promise<TotalParametersResponse> {
    let blockNumberGreaterThan: number | null = null;
    if (!resync) {
      blockNumberGreaterThan = await IrreversibleTracesRepository.findLastBlockNumber();
    }

    let totalProcessedCounter = 0;
    let totalSkippedCounter   = 0;

    do {
      const result = await this.processBatch(singleBatchSize, blockNumberGreaterThan);

      totalProcessedCounter += result.insertedCount;
      totalSkippedCounter   += result.skippedCount;

      blockNumberGreaterThan = result.lastBlockNumber;

      if (onlyOneBatch) {
        break;
      }

      console.log(`Batch is done. Batch size is: ${singleBatchSize}. Current totalProcessedCounter: ${totalProcessedCounter}`);
    } while (blockNumberGreaterThan !== null);

    return {
      totalProcessedCounter,
      totalSkippedCounter,
    };
  }

  private async processBatch(
    limit,
    blockNumberGreaterThan,
  ): Promise<{
    lastBlockNumber: number | null,
    skippedCount:    number,
    insertedCount:   number,
  }> {
    const manyTraces: ITrace[] =
      await BlockchainTracesSyncService.fetchTracesFromMongoDb(limit, blockNumberGreaterThan);

    if (!manyTraces || manyTraces.length === 0) {
      return {
        lastBlockNumber:  null,
        skippedCount:     0,
        insertedCount:    0,
      };
    }

    const manyProcessedTraces: any = [];
    for (const trace of manyTraces) {
      const processedTrace: IProcessedTrace | null = this.processOneTrace(trace);

      if (processedTrace !== null) {
        manyProcessedTraces.push(processedTrace);
      }
    }

    if (manyProcessedTraces.length === 0) {
      return {
        lastBlockNumber:  manyTraces[manyTraces.length - 1].blocknum,
        skippedCount:     manyTraces.length,
        insertedCount:    0,
      };
    }

    const preparedTransactions: string[] = manyProcessedTraces.map(item => item.tr_id);

    let insertedTransactions;
    try {
      insertedTransactions = await IrreversibleTracesRepository.insertManyTraces(manyProcessedTraces);
    } catch (error) {
      console.error('A fatal error is occurred. Lets dump the traces');
      console.dir(manyProcessedTraces);
      throw error;
    }

    const duplications = _.difference(preparedTransactions, insertedTransactions);

    if (duplications.length > 0) {
      WorkerLogger.info('There are transactions that are not inserted - duplications', {
        service: SERVICE_NAME,
        transactions_ids: duplications,
      });
    }

    return {
      lastBlockNumber:  manyTraces[manyTraces.length - 1].blocknum,
      skippedCount:     duplications.length,
      insertedCount:    insertedTransactions.length,
    };
  }

  private processOneTrace(trace: ITrace): IProcessedTrace | null {
    const { error } = this.tracesCommonFieldsValidator.validateOneTrace(trace);
    if (!error) {
      return this.blockchainTracesProcessorChain.processChain(trace);
    }

    return null;
  }

  private static async fetchTracesFromMongoDb(
    limit: number,
    blockNumberGreaterThan: number | null = null,
  ): Promise<ITrace[]> {
    const collection = await IrreversibleTracesClient.useCollection(ACTION_TRACES);

    const where: any = {
      $and: [
        { irreversible: true },
      ],
    };

    if (typeof blockNumberGreaterThan === 'number') {
      where.$and.push({
        blocknum: {
          $gt: blockNumberGreaterThan,
        },
      });
    }

    return collection
      .find(where)
      .sort({ blocknum: 1 })
      .limit(limit)
      .toArray();
  }
}

export = BlockchainTracesSyncService;
