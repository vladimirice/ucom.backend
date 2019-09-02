"use strict";
const errors_1 = require("../api/errors");
const { TransactionFactory } = require('ucom-libs-social-transactions');
class EosTransactionService {
    static async appendSignedUserVotesContent(user, body, contentBlockchainId, interactionType) {
        if (body.signed_transaction) {
            return;
        }
        body.signed_transaction = await TransactionFactory.getSignedUserToContentActivity(user.account_name, user.private_key, contentBlockchainId, interactionType);
    }
    static getEosVersionBasedOnSignedTransaction(signedTransaction) {
        if (!signedTransaction) {
            throw new errors_1.AppError('Signed transaction must be determined');
        }
        return {
            eosJsV2: signedTransaction.includes('serializedTransaction'),
        };
    }
}
module.exports = EosTransactionService;
