import { IMongoTransaction } from '../interfaces/mongo-interfaces';

import MongoExternalModelProvider = require('../../eos/service/mongo-external-model-provider');
import IrreversibleTracesClient = require('../client/irreversible-traces-client');
import BlockchainTrTracesRepository = require('../../eos/repository/blockchain-tr-traces-repository');

const ACTION_TRACES = MongoExternalModelProvider.actionTracesCollection();

class BlockchainTracesSyncService {
  public static async process(limit: number = 100): Promise<void> {
    // TODO - fetch last blocknum
    // const idGreaterThanString = await blockchainTrTracesRepository.findLastExternalIdByTrType(trType);
    let blockNumberGreaterThan = null;
    let totalAmount = 0;

    do {
      const docs = await this.fetchDocsFromMongoDb(limit, blockNumberGreaterThan); // TODO - move to repository

      if (docs.length === 0 || !docs) {
        console.log(
          `Nothing to process. Batch size is ${limit}, blockNumberGreaterThan is: ${blockNumberGreaterThan || 'not set'}`,
        );
        break;
      }

      // TODO - transaction validator
      const processedData = this.processDocsForStorage(docs);

      // if (processedData.length === 0) {
      //   console.log('Nothing to process because all transactions are malformed. See logs');
      // } else {
      await BlockchainTrTracesRepository.insertManyTrTraces(processedData);
      // }

      blockNumberGreaterThan = docs[docs.length - 1].blocknum;

      totalAmount += docs.length;

      console.log(`current total processed amount is: ${totalAmount}.`);
    } while (1);

    /*
    ask for last block or blocks (id > last memorized id) - 0.5
    foreach every block - 0.5
    Autotests, patterns implementations - 1.5h
 */
  }

  private static processDocsForStorage(manyDocs: IMongoTransaction[]) {
    // chain of responsibility - check conditions for every transaction processing block - 1h
    // If match then process it - call related processor => Save processed data to postgres (same structure but new table) - 0.5h

    for (const doc of manyDocs) {
      // @ts-ignore
      // eslint-disable-next-line no-underscore-dangle
      const a = doc._id.toString();

      // @ts-ignore
      const b = 0;
    }

    return manyDocs;
  }

  private static async fetchDocsFromMongoDb(limit, blockNumberGreaterThan: number | null = null) {
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
