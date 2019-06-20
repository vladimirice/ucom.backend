/* eslint-disable no-console */
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';
import { IProcessedTrace, ITrace } from '../interfaces/blockchain-traces-interfaces';
import { WorkerLogger } from '../../../config/winston';
import { ITraceChainMetadata } from '../interfaces/traces-sync-interfaces';
import { AppError } from '../../api/errors';

import MongoExternalModelProvider = require('../../eos/service/mongo-external-model-provider');
import IrreversibleTracesClient = require('../client/irreversible-traces-client');
import TracesCommonFieldsValidator = require('../validator/traces-common-fields-validator');
import BlockchainTracesProcessorChain = require('./blockchain-traces-processor-chain');
import IrreversibleTracesRepository = require('../repository/irreversible-traces-repository');

const _ = require('lodash');

const ACTION_TRACES = MongoExternalModelProvider.actionTracesCollection();

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

  public async process(limit: number = 100): Promise<void> {
    // TODO - fetch last blocknum
    // const idGreaterThanString = await blockchainTrTracesRepository.findLastExternalIdByTrType(trType);
    let blockNumberGreaterThan: number | null = null;
    let totalAmount = 0;
    let totalProcessedAmount = 0;

    do {
      const manyTraces: ITrace[] =
        await BlockchainTracesSyncService.fetchTracesFromMongoDb(limit, blockNumberGreaterThan);

      if (!manyTraces || manyTraces.length === 0) {
        break;
      }

      const manyProcessedTraces: any = [];
      for (const trace of manyTraces) {
        const processedTrace: any = this.processOneTrace(trace);
        manyProcessedTraces.push(processedTrace);
      }

      if (manyProcessedTraces.length === 0) {
        throw new AppError('It must be at least one trace to process');
      }

      if (manyProcessedTraces.length !== manyTraces.length) {
        throw new AppError('manyProcessedTraces.length !== manyTraces.length');
      }

      const preparedTransactions: string[] = manyProcessedTraces.map(item => item.tr_id);
      const insertedTransactions = await IrreversibleTracesRepository.insertManyTraces(manyProcessedTraces);

      const duplications = _.difference(preparedTransactions, insertedTransactions);

      if (duplications.length > 0) {
        console.log(`There are transactions that are not inserted:\n${duplications.join('\n')}`);
      }

      blockNumberGreaterThan = manyTraces[manyTraces.length - 1].blocknum;
      totalAmount += preparedTransactions.length;
      totalProcessedAmount += insertedTransactions.length;

      // Return this for worker
      console.log(`Current prepared to process: ${preparedTransactions.length}, inserted: ${insertedTransactions.length}`);
      console.log(`Total prepared to process: ${totalAmount}, inserted: ${totalProcessedAmount}`);
      // eslint-disable-next-line no-constant-condition
    } while (1);
  }

  private processOneTrace(trace: ITrace): IProcessedTrace {
    const metadata: ITraceChainMetadata = {
      isError: false,
    };

    const { error } = this.tracesCommonFieldsValidator.validateOneTrace(trace);
    if (error) {
      WorkerLogger.error('Malformed transaction. tracesCommonFieldsValidator failure. Write to the DB as unknown transaction', {
        service: 'blockchain-traces-sync',
        error,
      });

      metadata.isError = true;
    }

    return this.blockchainTracesProcessorChain.processChain(trace, metadata);
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
