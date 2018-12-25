const { ObjectId }  = require('mongodb');
const moment        = require('moment');

const { WorkerLogger } = require('../../../../config/winston');
const { TrTracesProcessorError } = require('../../errors/errors');

const BlockchainTrTracesDictionary  = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

const MongodbTrTracesRepository     = require('../../repository/mongodb-tr-traces-repository');
const BlockchainTrTracesRepository  = require('../../repository/blockchain-tr-traces-repository');
const TrTracesProcessor             = require('./tr-traces-processor');

const BATCH_SIZE = process.env.NODE_ENV === 'test' ? 10 : 200;
const ALLOWED_LAST_BLOCK_DELAY_IN_MINUTES = 10;

const TR_TYPES_NOT_TO_SYNC = [
  BlockchainTrTracesDictionary.getTypeMyselfRegistration(),
];


class BlockchainTrTracesService {
  /**
   *
   * @param {number[]|null} transactionTypes  - for auto tests
   * @param {string[]|null} transactionIds    - for auto tests
   *
   * @returns {Promise<void>}
   */
  static async syncMongoDbAndPostgres(transactionTypes = null, transactionIds = null) {
    await this._checkLastBlock();

    transactionTypes = transactionTypes || BlockchainTrTracesDictionary.getAllTransactionTypes();

    await BlockchainTrTracesRepository.setSeqCurrentValByMaxNum();

    console.log(`Batch size is: ${BATCH_SIZE}.`);

    for(let i = 0; i < transactionTypes.length; i++) {
      if (~TR_TYPES_NOT_TO_SYNC.indexOf(transactionTypes[i])) {
        console.log(`This tr type is skipped by hardcode: ${transactionTypes[i]}`);
        continue;
      }

      console.log(`Lets begin sync for ${transactionTypes[i]}`);
      const hrstart = process.hrtime();
      await this._findAndSyncByTrType(transactionTypes[i], transactionIds);
      const hrend = process.hrtime(hrstart);
      console.log(`Sync is finished. Execution time is: ${hrend[0]} sec`);
    }
  }

  static async _checkLastBlock() {
    const last = await MongodbTrTracesRepository.findLastBlockStringDatetime();
    if (!last) {
      WorkerLogger.error('There is no any block in mongoDb');
    }

    const diff = moment().diff(moment(last), 'minutes');

    if (diff >= ALLOWED_LAST_BLOCK_DELAY_IN_MINUTES) {
      WorkerLogger.error(`There is mongoDb last block delay - more or equal than ${ALLOWED_LAST_BLOCK_DELAY_IN_MINUTES} minutes`);
    }
  }

  /**
   *
   * @param {number} trType
   * @param {string[]|null} transactionIds
   * @returns {Promise<void>}
   * @private
   */
  static async _findAndSyncByTrType(trType, transactionIds) {
    let idGreaterThan;

    const idGreaterThanString = await BlockchainTrTracesRepository.findLastExternalIdByTrType(trType);
    idGreaterThan = idGreaterThanString ? ObjectId(idGreaterThanString) : null;

    let totalAmount = 0;

    do {
      const docs = await MongodbTrTracesRepository.findTransactionTraces(trType, BATCH_SIZE, idGreaterThan, transactionIds);

      if (docs.length === 0 || !docs) {
        console.log(
          `Nothing to process. Batch size is ${BATCH_SIZE}, isGreaterThan is: ${idGreaterThan || idGreaterThan.toString()} : 'none'`
        );
        break;
      }

      const processedData = this._processDocsForStorage(docs, trType);

      if (processedData.length === 0) {
        console.log('Nothing to process because all transactions are malformed. See logs');
      } else {
        await BlockchainTrTracesRepository.insertManyTrTraces(processedData);
      }

      idGreaterThan = docs[docs.length - 1]._id;

      totalAmount += docs.length;

      if (transactionIds) {
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
       this._processForTestEnv(current);

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

  /**
   *
   * @param {Object} model
   * @private
   */
  static _processForTestEnv(model) {
    if (process.env.NODE_ENV !== 'test') {
      return;
    }

    const sampleBlockData = {
      "block_id": "00e5ca528753e676de4d55fdd8e613f62f25057b3641734c50e800a97e330339",
        "producer": "calc5",
        "block_num": 15059538,
        "validated": true,
        "executed_at": "2018-11-12T12:44:27.500",
        "irreversible": true,
        "previous_block_id": "00e5ca5116f451f3342ed0a4905ff2db0becf4a180fe5b0b3443086373f9dafd"
    };

    model.block_data = sampleBlockData;
  }

}

module.exports = BlockchainTrTracesService;