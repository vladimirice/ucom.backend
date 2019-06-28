import { ListResponse } from '../../../common/interfaces/lists-interfaces';

const moment = require('moment');

const blockchainTrTracesRepository  = require('../../repository/blockchain-tr-traces-repository');
const usersPostProcessor            = require('../../../users/user-post-processor');
const queryFilterService            = require('../../../api/filters/query-filter-service');

const blockchainTrTracesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;

class BlockchainTrTracesFetchService {
  /**
   *
   * @param {Object} query
   * @param {string} accountName
   * @returns {Promise<Object>}
   */
  static async getAndProcessOneUserTraces(query, accountName): Promise<ListResponse> {
    const params = queryFilterService.getQueryParameters(query, {}, []);

    const [data, totalAmount] = await Promise.all([
      blockchainTrTracesRepository.findAllByAccountNameFromTo(accountName, params),
      blockchainTrTracesRepository.countAllByAccountNameFromTo(accountName),
    ]);

    for (let i = 0; i < data.length; i += 1) {
      const current = data[i];
      current.updated_at = moment(current.tr_executed_at).utc().format();
      delete current.tr_executed_at;

      for (const field in current.tr_processed_data) {
        current[field] = current.tr_processed_data[field];
      }

      delete current.tr_processed_data;

      if (current.tr_type === blockchainTrTracesDictionary.getTypeTransfer()) {
        this.processTransferTransaction(current, accountName);
      } else {
        delete current.User;
      }

      delete current.account_name_from;
      delete current.account_name_to;
    }

    const metadata = queryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }

  /**
   *
   * @param {Object} current
   * @param {string} accountName
   * @private
   */
  private static processTransferTransaction(current, accountName) {
    if (current.User === null) {
      current.tr_type = blockchainTrTracesDictionary.getLabelTransferForeign();
      return;
    }

    if (current.account_name_from !== accountName && current.account_name_to !== accountName) {
      throw new Error(
        // tslint:disable-next-line:max-line-length
        `Malformed response of transaction. Account name or account to must match current user. Current is: ${JSON.stringify(current)}`,
      );
    }

    if (current.account_name_from === accountName) {
      current.tr_type = blockchainTrTracesDictionary.getLabelTransferFrom();
    } else if (current.account_name_to === accountName) {
      current.tr_type = blockchainTrTracesDictionary.getLabelTransferTo();
    }

    usersPostProcessor.processModelAuthorForListEntity(current.User);
  }
}

export = BlockchainTrTracesFetchService;
