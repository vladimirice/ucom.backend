import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { BlockchainTracesDiTypes } from '../interfaces/di-interfaces';
import { IBlockchainTrace } from '../interfaces/blockchain-traces-interfaces';

import MongoExternalModelProvider = require('../../eos/service/mongo-external-model-provider');
import IrreversibleTracesClient = require('../client/irreversible-traces-client');
import TracesCommonFieldsValidator = require('../validator/traces-common-fields-validator');

const ACTION_TRACES = MongoExternalModelProvider.actionTracesCollection();

@injectable()
class BlockchainTracesSyncService {
  private readonly tracesCommonFieldsValidator: TracesCommonFieldsValidator;

  public constructor(
    @inject(BlockchainTracesDiTypes.tracesCommonFieldsValidator) tracesCommonFieldsValidator,
  ) {
    this.tracesCommonFieldsValidator = tracesCommonFieldsValidator;
  }

  public async process(limit: number = 100): Promise<void> {
    // TODO - fetch last blocknum
    // const idGreaterThanString = await blockchainTrTracesRepository.findLastExternalIdByTrType(trType);
    let blockNumberGreaterThan: number | null = null;
    let totalAmount = 0;

    do {
      // TODO - move to repository
      const manyTraces: IBlockchainTrace[] =
        await BlockchainTracesSyncService.fetchTracesFromMongoDb(limit, blockNumberGreaterThan);

      if (!manyTraces || manyTraces.length === 0) {
        break;
      }

      const manyProcessedTraces: any = [];
      for (const trace of manyTraces) {
        // TODO - create a type for processedType
        const processedTrace: any = this.processOneTrace(trace);
        // TODO - catch processed Data
        // if (processedData.length === 0) {
        //   console.log('Nothing to process because all transactions are malformed. See logs');
        // } else {
        //
        // }

        manyProcessedTraces.push(processedTrace);
      }

      // TODO - insert to Db
      // await BlockchainTrTracesRepository.insertManyTrTraces(processedData);


      blockNumberGreaterThan = manyTraces[manyTraces.length - 1].blocknum;

      totalAmount += manyTraces.length;

      console.log(`current total processed amount is: ${totalAmount}.`);
    } while (1);

    /*
    ask for last block or blocks (id > last memorized id) - 0.5
    foreach every block - 0.5
    Autotests, patterns implementations - 1.5h
 */
  }

  private processOneTrace(
    trace: IBlockchainTrace,
  ) {
    // chain of responsibility - check conditions for every transaction processing block - 1h
    // If match then process it - call related processor => Save processed data to postgres (same structure but new table) - 0.5h

    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    const a = trace._id.toString();

    const { error, value: validatedTransaction } = this.tracesCommonFieldsValidator.validateOneTrace(trace);

    if (error) {
      // TODO - process an error
      // skip this transaction
    }

    // https://github.com/inversify/InversifyJS/blob/master/wiki/multi_injection.md
    // TODO - check a processor
    /**
       *
       * chain of responsibility
       * processor = validator + value processor
       *
       * inject a lot of processors.
       * in order to add a new processor:
       *    create a processor file with a special tag
       *    add it to inversify config
       *    write an autotest
       *
       */

    /**
       * universal validator
       * chain of responsibility processor:
       * determine a type
       * return a validator + processor for
       *
       * determine and process a type
       * return a result ready to save
       */

    return validatedTransaction;
  }

  private static async fetchTracesFromMongoDb(
    limit: number,
    blockNumberGreaterThan: number | null = null,
  ): Promise<IBlockchainTrace[]> {
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
      .sort({ blocknum: -1 })
      .limit(limit)
      .toArray();
  }
}

export = BlockchainTracesSyncService;
