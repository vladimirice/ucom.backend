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

const TR_TYPE_BUY_RAM           = 60;
const TR_TYPE_SELL_RAM          = 61;

const TR_TYPE_CLAIM_EMISSION    = 50;

const CURRENCY__UOS = 'UOS';

const BATCH_SIZE = 10;

class BlockchainTrTracesService {

  static async syncMongoDbAndPostgres() {
    const toProcess = [
      // TR_TYPE_TRANSFER,
      // TR_TYPE_STAKE_RESOURCES,
      // TR_TYPE_UNSTAKING_REQUEST,
      // TR_TYPE_VOTE_FOR_BP,
      // TR_TYPE_BUY_RAM,
      TR_TYPE_SELL_RAM
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
    const idGreaterThanString = await BlockchainTrTracesRepository.findLastExternalIdByTrType(trType);
    let idGreaterThan = idGreaterThanString ? ObjectId(idGreaterThanString) : null;
    let totalAmount = 0;

    const lengthToBreak = 10; // TODO - for tests
    do {
      const docs = await MongodbTrTracesRepository.findTransferTransactions(trType, BATCH_SIZE, idGreaterThan);

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

     if (!processed) {
       continue;
     }

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

  static _processTrStake(doc) {
    return BlockchainTrTracesService._processTrStakingOrUnstakingRequest(doc, true);
  }

  static _processTrUnstakingRequest(doc) {
    return BlockchainTrTracesService._processTrStakingOrUnstakingRequest(doc, false);
  }

  /**
   *
   * @param {Object} doc
   * @param {boolean} isStake
   * @private
   */
  static _processTrStakingOrUnstakingRequest(doc, isStake) {
    const cpuQuantityField  = isStake ? 'stake_cpu_quantity' : 'unstake_cpu_quantity';
    const netQuantityField  = isStake ? 'stake_net_quantity' : 'unstake_net_quantity';
    const skipWord          = isStake ? 'undelegatebw' : 'delegatebw';

    const resultObjProcessor = isStake ? BlockchainTrTracesService._getDataForStake
      : BlockchainTrTracesService._getDataForUnstaking;

    const tracedDataRequiredFields = [
      'from',
      'receiver',
      cpuQuantityField,
      netQuantityField,
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

    let traceOneAccountNameFrom;
    let traceOneAccountNameTo;

    let traceTwoAccountNameFrom;
    let traceTwoAccountNameTo;

    if (actOne.name !== skipWord) {
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

      traceOneCpuAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataOne[cpuQuantityField]);
      traceOneNetAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataOne[netQuantityField]);

      traceOneAccountNameFrom = traceDataOne.from;
      traceOneAccountNameTo = traceDataOne.receiver;
    }

    if (actTwo && actTwo.name !== skipWord) {
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

      traceTwoCpuAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataTwo[cpuQuantityField]);
      traceTwoNetAmount = BlockchainTrTracesService.getTokensAmountFromString(traceDataTwo[netQuantityField]);

      traceTwoAccountNameFrom = traceDataTwo.from;
      traceTwoAccountNameTo   = traceDataTwo.receiver;
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

    if (traceOneAccountNameFrom && traceTwoAccountNameFrom) {
      if (traceOneAccountNameFrom !== traceTwoAccountNameFrom) {
        WorkerLogger.error(
          `Malformed transaction traces. Account name from (from) field must be equal in both traces. Skipped. Doc is: ${JSON.stringify(doc)}`
        );

        return;
      }
    }

    if (traceOneAccountNameTo && traceTwoAccountNameTo) {
      if (traceOneAccountNameTo !== traceTwoAccountNameTo) {
        WorkerLogger.error(
          `Malformed transaction traces. Account name to (receiver) field must be equal in both traces. Skipped. Doc is: ${JSON.stringify(doc)}`
        );

        return;
      }
    }

    const accountNameFrom = traceOneAccountNameFrom || traceTwoAccountNameFrom;
    const accountNameTo   = traceOneAccountNameTo   || traceTwoAccountNameTo;
    if (accountNameFrom !== accountNameTo) {
      WorkerLogger.error(
        `Malformed transaction traces. Account name to (receiver) field must be equal to account name from (from). Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return;
    }

    return resultObjProcessor(
      traceOneCpuAmount, traceTwoCpuAmount,
      traceOneNetAmount, traceTwoNetAmount,
      doc, executedAtMoment,
      accountNameFrom, accountNameTo
    );
  }

  static _getDataForStake(
    traceOneCpuAmount, traceTwoCpuAmount,
    traceOneNetAmount, traceTwoNetAmount,
    doc, executedAtMoment,
    accountNameFrom, accountNameTo
  ) {
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
      account_name_from: accountNameFrom,
      account_name_to: accountNameTo,

      raw_tr_data: doc,
      tr_executed_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
      mongodb_created_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
    };
  }

  static _getDataForUnstaking(
    traceOneCpuAmount, traceTwoCpuAmount,
    traceOneNetAmount, traceTwoNetAmount,
    doc, executedAtMoment,
    accountNameFrom, accountNameTo
  ) {
    return {
      tr_type: TR_TYPE_UNSTAKING_REQUEST,
      tr_processed_data: {
        resources: {
          cpu: {
            unstaking_request: {
              amount: traceOneCpuAmount + traceTwoCpuAmount,
              currency: CURRENCY__UOS,
            },
          },
          net: {
            unstaking_request: {
              amount: traceOneNetAmount + traceTwoNetAmount,
              currency: CURRENCY__UOS,
            },
          }
        },
      },
      memo: '',
      tr_id: doc.id,
      external_id: doc._id.toString(),
      account_name_from: accountNameFrom,
      account_name_to: accountNameTo,

      raw_tr_data: doc,
      tr_executed_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
      mongodb_created_at: executedAtMoment.utc().format('YYYY-MM-DD HH:mm:ss'),
    };
  }


  /**
   *
   * @param {Object} doc
   * @returns {Object|null}
   * @private
   */
  static _processTrVoteForBp(doc) {
    const actionTraces = doc.action_traces;

    if (actionTraces.length !== 1 || !actionTraces[0]) {
      WorkerLogger.error(`Malformed transaction traces. Action traces should has only one element. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const act = actionTraces[0].act;

    if (!act) {
      WorkerLogger.error(`Malformed transaction traces. Action must contain act field. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const traceData = act.data;
    if (!traceData) {
      WorkerLogger.error(`Malformed transaction traces. Data inside trace is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const tracedDataRequiredFields = [
      'producers',
      'voter',
    ];

    const tracedDataMissedField = BlockchainTrTracesService._checkRequiredFields(tracedDataRequiredFields, traceData);
    if (tracedDataMissedField) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no field ${tracedDataMissedField} inside action trace. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    if (!BlockchainTrTracesService._checkDocCommonFields(doc)) {
      return;
    }

    const trProcessedData = {
      producers: traceData.producers,
    };

    return BlockchainTrTracesService._getProcessedObj(
      TR_TYPE_VOTE_FOR_BP,
      trProcessedData,
      doc,
      traceData.voter,
    );
  }

  /**
   *
   * @param {Object} doc
   * @returns {Object|null}
   * @private
   */
  static _processTrBuyRamBytes(doc) {
    const actionTraces = doc.action_traces;

    if (actionTraces.length !== 1 || !actionTraces[0]) {
      WorkerLogger.error(`Malformed transaction traces. Action traces should has only one element. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const act = actionTraces[0].act;

    if (!act) {
      WorkerLogger.error(`Malformed transaction traces. Action must contain act field. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const traceData = act.data;
    if (!traceData) {
      WorkerLogger.error(`Malformed transaction traces. Data inside trace is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const tracedDataRequiredFields = [
      'payer',
      'receiver',
      'bytes',
    ];

    const tracedDataMissedField = BlockchainTrTracesService._checkRequiredFields(tracedDataRequiredFields, traceData);
    if (tracedDataMissedField) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no field ${tracedDataMissedField} inside action trace. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    if (!BlockchainTrTracesService._checkDocCommonFields(doc)) {
      return null;
    }

    const inlineTraces = actionTraces[0].inline_traces;

    if (!inlineTraces || inlineTraces.length !== 2 || inlineTraces.length === 0) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no inline traces. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    // process inline traces

    if (!inlineTraces[0] || !inlineTraces[0].act || !inlineTraces[0].act.data || !inlineTraces[0].act.data.quantity) {
      WorkerLogger.error(
        `Malformed transaction traces. First inline trace structure is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    if (!inlineTraces[1] || !inlineTraces[1].act || !inlineTraces[1].act.data || !inlineTraces[1].act.data.quantity) {
      WorkerLogger.error(
        `Malformed transaction traces. Second inline trace structure is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    const tokensAmount = BlockchainTrTracesService.getTokensAmountFromString(inlineTraces[0].act.data.quantity)
      + BlockchainTrTracesService.getTokensAmountFromString(inlineTraces[1].act.data.quantity);

    if (traceData.payer !== traceData.receiver) {
      WorkerLogger.error(
        `Malformed transaction traces. traceData payer must be the same as traceData receiver. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    const trProcessedData = {
      resources: {
        ram: {
          dimension: 'kB',
          amount:  traceData.bytes / 1024,
          tokens: {
            amount: tokensAmount,
            currency: CURRENCY__UOS,
          },
        },
      },
    };

    return BlockchainTrTracesService._getProcessedObj(
      TR_TYPE_BUY_RAM,
      trProcessedData,
      doc,
      traceData.payer,
      traceData.receiver,
    );
  }

  /**
   *
   * @param {Object} doc
   * @returns {Object|null}
   * @private
   */
  static _processTrSellRamBytes(doc) {
    const actionTraces = doc.action_traces;

    if (actionTraces.length !== 1 || !actionTraces[0]) {
      WorkerLogger.error(`Malformed transaction traces. Action traces should has only one element. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const act = actionTraces[0].act;

    if (!act) {
      WorkerLogger.error(`Malformed transaction traces. Action must contain act field. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const traceData = act.data;
    if (!traceData) {
      WorkerLogger.error(`Malformed transaction traces. Data inside trace is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`);

      return null;
    }

    const tracedDataRequiredFields = [
      'account',
      'bytes',
    ];

    const tracedDataMissedField = BlockchainTrTracesService._checkRequiredFields(tracedDataRequiredFields, traceData);
    if (tracedDataMissedField) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no field ${tracedDataMissedField} inside action trace. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    if (!BlockchainTrTracesService._checkDocCommonFields(doc)) {
      return null;
    }

    const inlineTraces = actionTraces[0].inline_traces;

    if (!inlineTraces || inlineTraces.length !== 2 || inlineTraces.length === 0) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no inline traces. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    // process inline traces

    if (!inlineTraces[0] || !inlineTraces[0].act || !inlineTraces[0].act.data || !inlineTraces[0].act.data.quantity || !inlineTraces[0].act.data.memo) {
      WorkerLogger.error(
        `Malformed transaction traces. First inline trace structure is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    if (!inlineTraces[1] || !inlineTraces[1].act || !inlineTraces[1].act.data || !inlineTraces[1].act.data.quantity || !inlineTraces[1].act.data.memo) {
      WorkerLogger.error(
        `Malformed transaction traces. Second inline trace structure is malformed. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    let tokensAmount = 0;

    const inlineTraceOneQuantity = BlockchainTrTracesService.getTokensAmountFromString(inlineTraces[0].act.data.quantity);
    const inlineTraceTwoQuantity = BlockchainTrTracesService.getTokensAmountFromString(inlineTraces[1].act.data.quantity);

    let isFee = false;
    if (inlineTraces[0].act.data.memo.includes('fee')) {
      tokensAmount -= inlineTraceOneQuantity;
      isFee = true;
    } else {
      tokensAmount += inlineTraceOneQuantity;
    }

    if (inlineTraces[1].act.data.memo.includes('fee')) {
      tokensAmount -= inlineTraceTwoQuantity;
      isFee = true;
    } else {
      tokensAmount += inlineTraceTwoQuantity;
    }

    if(!isFee) {
      WorkerLogger.error(
        `Malformed transaction traces. There is no fee transaction inside inline traces. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    if(tokensAmount <= 0) {
      WorkerLogger.error(
        `Malformed transaction traces. tokens amount is less or equal zero. Skipped. Doc is: ${JSON.stringify(doc)}`
      );

      return null;
    }

    const trProcessedData = {
      resources: {
        ram: {
          dimension: 'kB',
          amount:  traceData.bytes / 1024,
          tokens: {
            amount: tokensAmount,
            currency: CURRENCY__UOS,
          },
        },
      },
    };

    return BlockchainTrTracesService._getProcessedObj(
      TR_TYPE_SELL_RAM,
      trProcessedData,
      doc,
      traceData.account,
      traceData.account,
    );
  }

  /**
   *
   * @param {Object} doc
   * @returns {boolean}
   * @private
   */
  static _checkDocCommonFields(doc) {
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

      return false;
    }

    return true;
  }

  /**
   *
   * @param {number} trType
   * @param {Object} trProcessedData
   * @param {Object} doc
   * @param {string} accountNameFrom
   * @param {string|null} accountNameTo
   * @param memo
   * @returns {{tr_type: *, tr_processed_data: *, memo: string, tr_id: *, external_id: string, account_name_from: *, account_name_to: *, raw_tr_data: *, tr_executed_at: string, mongodb_created_at: string}}
   * @private
   */
  static _getProcessedObj(trType, trProcessedData, doc, accountNameFrom, accountNameTo = null, memo = '') {
    const executedAtMoment = moment(doc.createdAt);

    return {
      tr_type: trType,
      tr_processed_data: trProcessedData,
      memo,
      tr_id: doc.id,
      external_id: doc._id.toString(),
      account_name_from: accountNameFrom,
      account_name_to: accountNameTo,

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
      [TR_TYPE_TRANSFER]:           this._processTrTransfer,
      [TR_TYPE_STAKE_RESOURCES]:    this._processTrStake,
      [TR_TYPE_UNSTAKING_REQUEST]:  this._processTrUnstakingRequest,
      [TR_TYPE_VOTE_FOR_BP]:        this._processTrVoteForBp,
      [TR_TYPE_BUY_RAM]:            this._processTrBuyRamBytes,
      [TR_TYPE_SELL_RAM]:           this._processTrSellRamBytes,
    };

    if (trToProc[trType]) {
      return trToProc[trType];
    }

    throw new Error(`There is no processor for trType: ${trType}`);
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