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
            const { signedPayload, pushingResponse } = await AirdropsTransactionsSender.sendTransaction(item);
            await knex.transaction(async (trx) => {
                const externalTrId = await OutgoingTransactionsLogRepository.insertOneRow(pushingResponse.transaction_id, signedPayload, pushingResponse, EosBlockchainStatusDictionary.getStatusIsSent(), trx);
                await Promise.all([
                    AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(item.account_id_from, item.account_id_to, item.amount, trx, false, null, {}, externalTrId),
                    AirdropsUsersRepository.setStatusWaiting(item.id, trx),
                ]);
            });
        }
        catch (error) {
            const toLog = new ErrorEventToLogDto('An error is occurred. Lets skip this item', item, error);
            winston_1.WorkerLogger.error(toLog);
        }
    }
}
module.exports = AirdropsUsersToWaitingService;
