const moment = require('moment');

const BlockchainTrTracesRepository  = require('../repository/blockchain-tr-traces-repository');
const UsersPostProcessor            = require('../../users/user-post-processor');
const QueryFilterService            = require('../../api/filters/query-filter-service');

const BlockchainTrTracesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

class BlockchainTrTracesFetchService {
  /**
   *
   * @param {Object} query
   * @param {string} accountName
   * @returns {Promise<Object>}
   */
  static async getAndProcessOneUserTraces(query, accountName) {
    let params = QueryFilterService.getQueryParameters(query, {}, []);

    const [data, totalAmount] = await Promise.all([
      BlockchainTrTracesRepository.findAllByAccountNameFromTo(accountName, params),
      BlockchainTrTracesRepository.countAllByAccountNameFromTo(accountName)
    ]);

    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      current.updated_at = moment(current.tr_executed_at).utc().format();
      delete current.tr_executed_at;

      for (const field in current.tr_processed_data) {
        current[field] = current.tr_processed_data[field];
      }

      delete current.tr_processed_data;

      if (current.tr_type === BlockchainTrTracesDictionary.getTypeTransfer()) {
        this._processTransferTransaction(current, accountName);
      } else {
        delete current.User;
      }

      delete current.account_name_from;
      delete current.account_name_to;
    }

    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata
    };
  }

  /**
   *
   * @param {Object} current
   * @param {string} accountName
   * @private
   */
  static _processTransferTransaction(current, accountName) {
    if (current.User === null) {
      current.tr_type = BlockchainTrTracesDictionary.getLabelTransferForeign();
      return;
    }

    if (current.account_name_from !== accountName && current.account_name_to !== accountName) {
      throw new Error(
        `Malformed response of transaction. Account name or account to must match current user. Current is: ${JSON.stringify(current)}`
      );
    }

    if (current.account_name_from === accountName) {
      current.tr_type = BlockchainTrTracesDictionary.getLabelTransferFrom();
    } else if (current.account_name_to === accountName) {
      current.tr_type = BlockchainTrTracesDictionary.getLabelTransferTo();
    }

    UsersPostProcessor.processModelAuthorForListEntity(current.User);
  }
}

module.exports = BlockchainTrTracesFetchService;