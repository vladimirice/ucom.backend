const BlockchainTrTracesRepository  = require('../repository/blockchain-tr-traces-repository');
const UsersPostProcessor            = require('../../users/user-post-processor');

const moment = require('moment');

const TR_TYPE__TRANSFER_FROM    = 10;
const TR_TYPE__TRANSFER_TO      = 11;
const TR_TYPE_TRANSFER          = 12;
const TR_TYPE_TRANSFER_FOREIGN  = 13;

class BlockchainTrTracesFetchService {
  /**
   *
   * @param {string} accountName
   * @returns {Promise<Object[]>}
   */
  static async getAndProcessOneUserTraces(accountName) {
    const dbData = await BlockchainTrTracesRepository.findAllByAccountNameFrom(accountName);

    for (let i = 0; i < dbData.length; i++) {
      const current = dbData[i];
      current.updated_at = moment(current.tr_executed_at).utc().format();
      delete current.tr_executed_at;

      for (const field in current.tr_processed_data) {
        current[field] = current.tr_processed_data[field];

      }

      delete current.tr_processed_data;

      if (current.tr_type === TR_TYPE_TRANSFER) {
        this._processTransferTransaction(current, accountName);
      } else {
        delete current.User;
      }

      delete current.account_name_from;
      delete current.account_name_to;
    }

    return dbData;
  }

  /**
   *
   * @param {Object} current
   * @param {string} accountName
   * @private
   */
  static _processTransferTransaction(current, accountName) {
    if (current.User === null) {
      current.tr_type = TR_TYPE_TRANSFER_FOREIGN;
      return;
    }

    if (current.account_name_from !== accountName && current.account_name_to !== accountName) {
      throw new Error(
        `Malformed response of transaction. Account name or account to must match current user. Current is: ${JSON.stringify(current)}`
      );
    }

    if (current.account_name_from === accountName) {
      current.tr_type = TR_TYPE__TRANSFER_FROM;
    } else if (current.account_name_to === accountName) {
      current.tr_type = TR_TYPE__TRANSFER_TO;
    }

    UsersPostProcessor.processModelAuthorForListEntity(current.User);
  }
}

module.exports = BlockchainTrTracesFetchService;