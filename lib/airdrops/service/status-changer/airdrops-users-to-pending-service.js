"use strict";
const errors_1 = require("../../../api/errors");
const winston_1 = require("../../../../config/winston");
const AirdropsUsersExternalDataRepository = require("../../repository/airdrops-users-external-data-repository");
const AirdropsFetchRepository = require("../../repository/airdrops-fetch-repository");
const UsersActivityRepository = require("../../../users/repository/users-activity-repository");
const AirdropsTokensRepository = require("../../repository/airdrops-tokens-repository");
const AirdropUsersValidator = require("../../validator/airdrop-users-validator");
const knex = require("../../../../config/knex");
const AccountsCreatorService = require("../../../accounts/service/accounts-creator-service");
const AccountsTransactionsCreatorService = require("../../../accounts/service/accounts-transactions-creator-service");
const AirdropsUsersRepository = require("../../repository/airdrops-users-repository");
class AirdropsUsersToPendingService {
    static async process(airdropId) {
        const manyFreshUsers = await AirdropsUsersExternalDataRepository.getManyUsersWithStatusNew(airdropId);
        if (manyFreshUsers.length === 0) {
            return;
        }
        const airdrop = await AirdropsFetchRepository.getAirdropByPk(airdropId);
        const usersToProcess = [];
        for (const freshUser of manyFreshUsers) {
            const isOk = await this.areAllConditionsFulfilledByUserId(freshUser.user_id, airdrop.conditions.community_id_to_follow);
            if (isOk) {
                usersToProcess.push(freshUser);
            }
        }
        if (usersToProcess.length === 0) {
            return;
        }
        const manyAirdropDebts = await AirdropsTokensRepository.getAirdropsAccountDataById(airdropId);
        for (const oneUser of usersToProcess) {
            AirdropUsersValidator.checkTokensConsistency(manyAirdropDebts, oneUser.json_data.tokens);
            await this.reserveAirdropForOneUser(airdropId, oneUser, manyAirdropDebts);
        }
    }
    static async reserveAirdropForOneUser(airdropId, user, manyAirdropDebts) {
        await knex.transaction(async (trx) => {
            for (const airdropDebt of manyAirdropDebts) {
                const userTokenData = user.json_data.tokens.find(item => item.symbol === airdropDebt.symbol);
                if (!userTokenData || userTokenData.amount_claim < 0) {
                    throw new errors_1.AppError(`Malformed amount for symbol ${airdropDebt.symbol}`, 500);
                }
                if (userTokenData.amount_claim === 0) {
                    winston_1.WorkerLogger.info(`There is no tokens with symbol ${airdropDebt.symbol} for user with ID: ${user.user_id}`);
                    continue;
                }
                const tokenToClaim = {
                    symbol_id: airdropDebt.symbol_id,
                    amount: userTokenData.amount_claim,
                };
                await this.createAccountsAndTrxForToken(airdropId, user.user_id, airdropDebt.debt_account_id, tokenToClaim, trx);
                await AirdropsUsersExternalDataRepository.changeStatusToPending(user.users_external_id, trx);
            }
        });
    }
    static async areAllConditionsFulfilledByUserId(userId, orgId) {
        // Auth and external data are already checked by first DB request
        return UsersActivityRepository.doesUserFollowOrg(userId, orgId);
    }
    static async createAccountsAndTrxForToken(airdropId, userId, debtAccountId, token, trx) {
        const reservedAccountId = await AccountsCreatorService.createNewReservedAccount(token.symbol_id, userId, trx);
        const waitingAccountId = await AccountsCreatorService.createNewWaitingAccount(token.symbol_id, userId, trx);
        const walletAccountId = await AccountsCreatorService.createNewWalletAccount(token.symbol_id, userId, trx);
        await AccountsTransactionsCreatorService.createTrxBetweenTwoAccounts(debtAccountId, reservedAccountId, token.amount, trx);
        await AirdropsUsersRepository.insertNewRecord(userId, airdropId, reservedAccountId, waitingAccountId, walletAccountId, trx);
    }
}
module.exports = AirdropsUsersToPendingService;
