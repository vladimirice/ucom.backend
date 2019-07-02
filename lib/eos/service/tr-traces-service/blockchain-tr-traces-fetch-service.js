"use strict";
const IrreversibleTracesRepository = require("../../../blockchain-traces/repository/irreversible-traces-repository");
const moment = require('moment');
const blockchainTrTracesDictionary = require('ucom-libs-wallet').Dictionary.BlockchainTrTraces;
const usersPostProcessor = require('../../../users/user-post-processor');
const queryFilterService = require('../../../api/filters/query-filter-service');
class BlockchainTrTracesFetchService {
    /**
     *
     * @param {Object} query
     * @param {string} accountName
     * @returns {Promise<Object>}
     */
    static async getAndProcessOneUserTraces(query, accountName) {
        const params = queryFilterService.getQueryParameters(query, {}, []);
        const [data, totalAmount] = await Promise.all([
            IrreversibleTracesRepository.findAllByAccountNameFromTo(accountName, params),
            IrreversibleTracesRepository.countAllByAccountNameFromTo(accountName),
        ]);
        for (const current of data) {
            current.updated_at = moment(current.tr_executed_at).utc().format();
            delete current.tr_executed_at;
            for (const field in current.tr_processed_data) {
                if (!current.tr_processed_data.hasOwnProperty(field)) {
                    continue;
                }
                current[field] = current.tr_processed_data[field];
            }
            delete current.tr_processed_data;
            if (current.tr_type === blockchainTrTracesDictionary.getTypeTransfer()) {
                this.processTransferTransaction(current, accountName);
            }
            else {
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
    static processTransferTransaction(current, accountName) {
        if (current.User === null) {
            current.tr_type = blockchainTrTracesDictionary.getLabelTransferForeign();
            return;
        }
        if (current.account_name_from !== accountName && current.account_name_to !== accountName) {
            throw new Error(
            // tslint:disable-next-line:max-line-length
            `Malformed response of transaction. Account name or account to must match current user. Current is: ${JSON.stringify(current)}`);
        }
        if (current.account_name_from === accountName) {
            current.tr_type = blockchainTrTracesDictionary.getLabelTransferFrom();
        }
        else if (current.account_name_to === accountName) {
            current.tr_type = blockchainTrTracesDictionary.getLabelTransferTo();
        }
        usersPostProcessor.processOnlyUserItself(current.User);
    }
}
module.exports = BlockchainTrTracesFetchService;
