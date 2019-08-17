"use strict";
const { TransactionFactory } = require('ucom-libs-social-transactions');
const eosBlockchainUniqid = require('../eos/eos-blockchain-uniqid');
class EosTransactionService {
    static async appendSignedUserVotesContent(user, body, contentBlockchainId, interactionType) {
        if (body.signed_transaction) {
            return;
        }
        body.signed_transaction = await TransactionFactory.getSignedUserToContentActivity(user.account_name, user.private_key, contentBlockchainId, interactionType);
    }
    static getEosVersionBasedOnSignedTransaction(signedTransaction) {
        return {
            eosJsV2: signedTransaction.includes('serializedTransaction'),
        };
    }
    static async appendSignedUserCreatesRepost(body, user, parentContentBlockchainId) {
        body.blockchain_id = eosBlockchainUniqid.getUniqidForRepost();
        body.signed_transaction = await TransactionFactory.getSignedUserCreatesRepostOtherPost(user.account_name, user.private_key, body.blockchain_id, parentContentBlockchainId);
    }
    static async appendSignedLegacyUserCreatesDirectPostForOtherUser(body, user, accountNameFor) {
        body.blockchain_id = eosBlockchainUniqid.getUniqidForDirectPost();
        body.signed_transaction = await TransactionFactory.getSignedDirectPostCreationForUser(user.account_name, user.private_key, accountNameFor, body.blockchain_id);
    }
    static async appendSignedUserCreatesDirectPostForOrg(body, user, orgBlockchainIdTo) {
        body.blockchain_id = eosBlockchainUniqid.getUniqidForDirectPost();
        body.signed_transaction = await TransactionFactory.getSignedDirectPostCreationForOrg(user.account_name, user.private_key, orgBlockchainIdTo, body.blockchain_id);
    }
}
module.exports = EosTransactionService;
