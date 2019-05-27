"use strict";
const winston_1 = require("../../../../config/winston");
const AirdropsUsersRepository = require("../../repository/airdrops-users-repository");
const LegacyAccountNamesDictionary = require("../../../users/dictionary/legacy-account-names-dictionary");
const AirdropsTransactionsSender = require("../blockchain/airdrops-transactions-sender");
const ErrorEventToLogDto = require("../../../common/dto/error-event-to-log-dto");
const knex = require("../../../../config/knex");
const OutgoingTransactionsLogRepository = require("../../../eos/repository/outgoing-transactions-log-repository");
const EosBlockchainStatusDictionary = require("../../../eos/eos-blockchain-status-dictionary");
const AccountsTransactionsCreatorService = require("../../../accounts/service/accounts-transactions-creator-service");
class AirdropsUsersToWaitingService {
    static async process(limit) {
        let processedCounter = 0;
        const usersToProcess = await AirdropsUsersRepository.getDataForStatusToWaiting(limit);
        console.log(`Airdrops users rows to process: ${usersToProcess.length}`);
        for (const item of usersToProcess) {
            await this.processOneItem(item);
            processedCounter += 1;
        }
        console.log(`Processed counter value: ${processedCounter}`);
        return {
            processedCounter,
        };
    }
    static async processOneItem(item) {
        if (LegacyAccountNamesDictionary.isAccountNameLegacy(item.account_name_to)) {
            return;
        }
        try {
            const externalTrId = await this.processBlockchainTransaction(item);
            await knex.transaction(async (trx) => {
                await Promise.all([
                    AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(item.account_id_from, item.account_id_to, item.amount, trx, false, null, {}, externalTrId),
                    AirdropsUsersRepository.setStatusWaiting(item.id, trx),
                ]);
            });
        }
        catch (error) {
            console.error('an error is occurred. Item is skipped. See logs.');
            const toLog = new ErrorEventToLogDto('An error is occurred. Lets skip this item', item, error);
            winston_1.WorkerLogger.error(toLog);
        }
    }
    static async processBlockchainTransaction(item) {
        try {
            const { signedPayload, pushingResponse } = await AirdropsTransactionsSender.sendTransaction(item);
            return OutgoingTransactionsLogRepository.insertOneRow(pushingResponse.transaction_id, signedPayload, pushingResponse, EosBlockchainStatusDictionary.getStatusIsSent());
        }
        catch (error) {
            if (!error.json.error.details[0].message.includes('Already have the receipt with the same external_id')) {
                throw error;
            }
            console.log(`
        There is a receipt already written to the blockchain. 
        Possibly worker had been interrupted after the pushing but before further steps.
        Let's trow an exception anyway. It is required to process such kind of error manually
      `);
            throw error;
        }
    }
}
module.exports = AirdropsUsersToWaitingService;
