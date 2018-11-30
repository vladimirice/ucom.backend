const { WorkerLogger } = require('../../../config/winston');
const moment = require('moment');


const {ObjectId} = require('mongodb'); // or ObjectID


const MongodbTrTracesRepository     = require('../repository/mongodb-tr-traces-repository');
const BlockchainTrTracesRepository  = require('../repository/blockchain-tr-traces-repository');

const TR_TYPE__TRANSFER_FROM  = 10;
const TR_TYPE__TRANSFER_TO    = 11;
const TR_TYPE_TRANSFER        = 12;

const TR_TYPE_STAKE_RESOURCES = 20;

const TR_TYPE_UNSTAKING_REQUEST = 30;
const TR_TYPE_VOTE_FOR_BP       = 40;

const TR_TYPE_CLAIM_EMISSION    = 50;

const CURRENCY__UOS = 'UOS';

const BATCH_SIZE = 10;

class BlockchainTrTracesService {

  static async syncMongoDbAndPostgres() {
    const toProcess = [
      // TR_TYPE_TRANSFER
      TR_TYPE_STAKE_RESOURCES
    ];

    for(let i = 0; i < toProcess.length; i++) {
      await this._findAndSyncByTrType(toProcess[i]);
    }
  }

  /**
   *
   * @param {number} trType
   * @returns {Promise<void>}
   * @private
   */
  static async _findAndSyncByTrType(trType) {
    // Get transfer transactions, undelegated transactions, etc....

    const idGreaterThanString = await BlockchainTrTracesRepository.findLastExternalIdByTrType(trType);
    let idGreaterThan = idGreaterThanString ? ObjectId(idGreaterThanString) : null;
    let totalAmount = 0;

    const lengthToBreak = 10; // TODO - for tests
    do {
      const docs = await MongodbTrTracesRepository.findTransferTransactions(trType, BATCH_SIZE, idGreaterThan);

      const a = 0;
      if (docs.length === 0 || !docs) {
        break;
      }

      // Prepare traces to save in db
      const processor     = this._getProcessor(trType);
      const processedData = this._processDocsForStorage(docs, processor);

      await BlockchainTrTracesRepository.insertManyTrTraces(processedData);
      idGreaterThan = docs[docs.length - 1]._id;

      totalAmount += docs.length;

      // TODO - for tests. Remove it
      if (totalAmount >= lengthToBreak) {
        break;
      }
    } while(1);

    await BlockchainTrTracesRepository.setSeqCurrentValByMaxNum();
  }

  /**
   *
   * @param {Object[]} docs
   * @param {Function} processor
   * @returns {Object[]}
   * @private
   */
  static _processDocsForStorage(docs, processor) {
    const result = [];
    for (let i = 0; i < docs.length; i++) {
     const current = docs[i];

     const processed = processor(current);

     result.push(processed);
    }

    return result;
  }

  /**
   *
   * @param {Object} doc
   * @private
   */
  static _processTrTransfer(doc) {
    const actionTraces = doc.action_traces;

    if (actionTraces.length !== 1 || !actionTraces[0]) {
      WorkerLogger.error(`Malformed transaction traces. Action traces should has only one element. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return;
    }

    const act = actionTraces[0].act;

    if (!act) {
      WorkerLogger.error(`Malformed transaction traces. Action must contain act field. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return;
    }

    const traceData = act.data;
    if (!traceData) {
      WorkerLogger.error(`Malformed transaction traces. Data inside trace is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return;
    }

    const tracedDataRequiredFields = [
      'from',
      'to',
      'memo',
      'quantity'
    ];

    const tracedDataMissedField = BlockchainTrTracesService._checkRequiredFields(tracedDataRequiredFields, traceData);
    if (tracedDataMissedField) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no field ${tracedDataMissedField} inside action trace. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return;
    }

    const docRequiredFields = [
      'id',
      '_id',
      'createdAt'
    ];

    const rootMissedField = BlockchainTrTracesService._checkRequiredFields(docRequiredFields, doc);
    if (rootMissedField) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no field ${rootMissedField} inside doc. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return;
    }

    const executedAtMoment = moment(doc.createdAt);

    return {
      tr_type: TR_TYPE_TRANSFER,
      tr_processed_data: {
        tokens: {
          active: BlockchainTrTracesService.getTokensAmountFromString(traceData.quantity),
          currency: CURRENCY__UOS,
        }
      },
      memo: traceData.memo,
      tr_id: doc.id,
      external_id: doc._id.toString(),
      account_name_from: traceData.from,
      account_name_to: traceData.to,

      raw_tr_data: doc,
      tr_executed_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
      mongodb_created_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
    };
  }
  /**
   *
   * @param {Object} doc
   * @private
   */
  static _processTrStakeResources(doc) {
    const tracedDataRequiredFields = [
      'from',
      'receiver',
      'stake_cpu_quantity',
      'stake_net_quantity',
    ];

    const actionTraces = doc.action_traces;

    if (!actionTraces || actionTraces.length > 2 || actionTraces.length === 0) {
      WorkerLogger.error(`Malformed transaction traces. Action traces are not correct. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return;
    }

    const actOne = actionTraces[0].act;
    const actTwo = actionTraces[1] ? actionTraces[1].act : null;

    // It is possible not to have actTwo
    if (!actOne) {
      WorkerLogger.error(`Malformed transaction traces. Action must contain act field. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return;
    }

    let traceDataOne = null;
    let traceDataTwo = null;

    let traceOneCpuAmount = 0;
    let traceOneNetAmount = 0;

    let traceTwoCpuAmount = 0;
    let traceTwoNetAmount = 0;

    if (actOne.name !== 'undelegatebw') {
      traceDataOne = actOne.data;

      if (!traceDataOne) {
        WorkerLogger.error(`Malformed transaction traces. Data inside trace is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`);

        return;
      }

      const tracedDataOneMissedField = BlockchainTrTracesService._checkRequiredFields(tracedDataRequiredFields, traceDataOne);
      if (tracedDataOneMissedField) {
        WorkerLogger.error(
          `Malformed transaction traces. There is no field ${tracedDataOneMissedField} inside action trace. Skipped. Doc is: ${JSON.stringify(doc)}`
        );

        return;
      }

      traceOneCpuAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataOne.stake_cpu_quantity);
      traceOneNetAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataOne.stake_net_quantity);
    }

    if (actTwo && actTwo.name !== 'undelegatebw') {
      traceDataTwo = actTwo.data;

      if (!traceDataTwo) {
        WorkerLogger.error(`Malformed transaction traces. Data inside trace is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`);

        return;
      }

      const tracedDataTwoMissedField = BlockchainTrTracesService._checkRequiredFields(tracedDataRequiredFields, traceDataTwo);
      if (tracedDataTwoMissedField) {
        WorkerLogger.error(
          `Malformed transaction traces. There is no field ${tracedDataTwoMissedField} inside action trace. Skipped. Doc is: ${JSON.stringify(doc)}`
        );

        return;
      }

      traceTwoCpuAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataTwo.stake_cpu_quantity);
      traceTwoNetAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataTwo.stake_net_quantity);
    }

    const docRequiredFields = [
      'id',
      '_id',
      'createdAt'
    ];

    const rootMissedField = BlockchainTrTracesService._checkRequiredFields(docRequiredFields, doc);
    if (rootMissedField) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no field ${rootMissedField} inside doc. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return;
    }

    // TODO - it must be taken from block timestamp
    const executedAtMoment = moment(doc.createdAt);

    return {
      tr_type: TR_TYPE_STAKE_RESOURCES,
      tr_processed_data: {
        resources: {
          cpu: {
            tokens: {
              self_delegated: traceOneCpuAmount + traceTwoCpuAmount,
              currency: CURRENCY__UOS,
            },
          },
          net: {
            tokens: {
              self_delegated: traceOneNetAmount + traceTwoNetAmount,
              currency: CURRENCY__UOS,
            },
          },
        },
      },
      memo: '',
      tr_id: doc.id,
      external_id: doc._id.toString(),
      account_name_from: null,
      account_name_to: null,

      raw_tr_data: doc,
      tr_executed_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
      mongodb_created_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  /**
   *
   * @param {string[]} expected
   * @param {Object} actual
   * @returns {string|null}
   *
   * @private
   */
  static _checkRequiredFields(expected, actual) {
    for(let i = 0; i < expected.length; i++) {
      const field = expected[i];
      if ((typeof actual[field]) !== 'undefined') {
        continue;
      }

      return field;
    }

    return null;
  }

  /**
   *
   * @param {number} trType
   * @returns {*}
   * @private
   */
  static _getProcessor(trType) {
    const trToProc = {
      [TR_TYPE_TRANSFER]:         this._processTrTransfer, // same for transfer to
      [TR_TYPE_STAKE_RESOURCES]:  this._processTrStakeResources, // same for transfer to
    };

    return trToProc[trType];
  }

  /**
   *
   * @param {string} stringValue
   * @param {string} token
   * @return {number}
   */
  static getTokensAmountFromString(stringValue, token = 'UOS') {
    let value = stringValue.replace(` ${token}`, '');

    return +value;
  }

  /**
   *
   * @param {string} stringValue
   * @return {number}
   */
  static getRamAmountFromString(stringValue) {
    let value = stringValue.replace(` RAM`, '');

    return +value;
  }

  /**
   *
   * @param {string} requestDatetime
   * @return {string}
   */
  static getRequestDateTime(requestDatetime) {
    const date = moment(requestDatetime + 'Z');
    return date.utc().format();
  }

  /**
   *
   * @param {string} requestDatetime
   * @return {string}
   */
  static getUnstakedOnDatetime(requestDatetime) {
    const date = moment(requestDatetime + 'Z');
    const newDate = date.add(3, 'days');

    return newDate.utc().format();
  }
}

module.exports = BlockchainTrTracesService;