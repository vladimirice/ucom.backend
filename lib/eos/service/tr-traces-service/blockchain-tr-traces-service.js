const { ObjectId } = require('mongodb');
const { WorkerLogger } = require('../../../../config/winston');
const { TrTracesProcessorError } = require('../../errors/errors');

const BlockchainTrTracesDictionary  = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

const MongodbTrTracesRepository     = require('../../repository/mongodb-tr-traces-repository');
const BlockchainTrTracesRepository  = require('../../repository/blockchain-tr-traces-repository');
const TrTracesProcessor             = require('./tr-traces-processor');

const BATCH_SIZE    = 200;

class BlockchainTrTracesService {
  /**
   *
   * @param {number[]|null} transactionTypes    - mainly for auto tests
   * @param {string|null} mongoDbIdGreaterThan  - mainly for auto tests
   * @param {string|null} mongoDbIdLessThan     - mainly for auto tests
   * @returns {Promise<void>}
   */
  static async syncMongoDbAndPostgres(
    transactionTypes = null,
    mongoDbIdGreaterThan = null,
    mongoDbIdLessThan = null
  ) {
    transactionTypes = transactionTypes || BlockchainTrTracesDictionary.getAllTransactionTypes();

    await BlockchainTrTracesRepository.setSeqCurrentValByMaxNum();

    console.log(`Batch size is: ${BATCH_SIZE}.`);

    for(let i = 0; i < transactionTypes.length; i++) {
      console.log(`Lets begin sync for ${transactionTypes[i]}`);
      const hrstart = process.hrtime();
      await this._findAndSyncByTrType(transactionTypes[i], mongoDbIdGreaterThan, mongoDbIdLessThan);
      const hrend = process.hrtime(hrstart);
      console.log(`Sync is finished. Execution time is: ${hrend[0]} sec`);
    }
  }

  /**
   *
   * @param {number} trType
   * @param {string|null} givenIdGreaterThan
   * @param {string|null} givenIdLessThan
   * @returns {Promise<void>}
   * @private
   */
  static async _findAndSyncByTrType(trType, givenIdGreaterThan = null, givenIdLessThan = null) {
    let idGreaterThan;

    if (givenIdGreaterThan) {
      idGreaterThan = ObjectId(givenIdGreaterThan);
    } else {
      const idGreaterThanString = await BlockchainTrTracesRepository.findLastExternalIdByTrType(trType);
      idGreaterThan = idGreaterThanString ? ObjectId(idGreaterThanString) : null;
    }

    let totalAmount = 0;

    do {
      const docs = await MongodbTrTracesRepository.findTransactionTraces(trType, BATCH_SIZE, idGreaterThan, givenIdLessThan);

      if (docs.length === 0 || !docs) {
        console.log(`Nothing to process. Batch size is ${BATCH_SIZE}, isGreaterThan is: ${idGreaterThan.toString()}`);
        break;
      }

      const processedData = this._processDocsForStorage(docs, trType);

      const a = 0;
      if (processedData.length === 0) {
        console.log('Nothing to process because all transactions are malformed. See logs');
      } else {
        await BlockchainTrTracesRepository.insertManyTrTraces(processedData);
      }

      idGreaterThan = docs[docs.length - 1]._id;

      totalAmount += docs.length;

      if (givenIdLessThan && givenIdGreaterThan) {
        // auto tests purpose
        break;
      }

      console.log(`current total processed amount is: ${totalAmount}.`);
    } while(1);

    await BlockchainTrTracesRepository.setSeqCurrentValByMaxNum();
  }

  /**
   *
   * @param {Object[]} docs
   * @param {number} trType
   * @returns {Object[]}
   * @private
   */
  static _processDocsForStorage(docs, trType) {
    const result = [];
    for (let i = 0; i < docs.length; i++) {
     const current = docs[i];

     try {
       const processed = TrTracesProcessor.processOneTrByType(current, trType);
       if (processed) {
         // hardcode. There is still one condition with return null
         result.push(processed);
       }
     } catch (e) {
       if (e instanceof TrTracesProcessorError) {
         e.message += ` Doc ID is: ${current._id}`;

         // do not push malformed transaction. Skip it.
         WorkerLogger.error(e);
       } else {
         throw e;
       }
     }
    }

    return result;
  }
}

module.exports = BlockchainTrTracesService;