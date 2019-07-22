"use strict";
const errors_1 = require("../../../api/errors");
const BlockchainUniqId = require("../../eos-blockchain-uniqid");
const EosContentInputProcessor = require("./eos-content-input-processor");
const { TransactionFactory, ContentTypeDictionary } = require('ucom-libs-social-transactions');
class EosPostsInputProcessor {
    static async addSignedTransactionDetailsToBody(body, user, postTypeId, organizationBlockchainId = null) {
        const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);
        if (transactionDetails !== null) {
            body.blockchain_id = transactionDetails.blockchain_id;
            body.signed_transaction = transactionDetails.signed_transaction;
            return {
                eosJsV2: true,
            };
        }
        if (postTypeId === ContentTypeDictionary.getTypeDirectPost()) {
            return {
                eosJsV2: false,
            };
        }
        // noinspection IfStatementWithTooManyBranchesJS
        if (postTypeId === ContentTypeDictionary.getTypeMediaPost()) {
            body.blockchain_id = BlockchainUniqId.getUniqidForMediaPost();
        }
        else if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
            body.blockchain_id = BlockchainUniqId.getUniqidForPostOffer();
        }
        else {
            throw new errors_1.BadRequestError({ post_type_id: `Unsupported post type id: ${postTypeId}` });
        }
        if (organizationBlockchainId) {
            // eslint-disable-next-line no-underscore-dangle
            body.signed_transaction = await TransactionFactory._getSignedOrganizationCreatesContent(user.account_name, user.private_key, organizationBlockchainId, body.blockchain_id, postTypeId);
        }
        else {
            // eslint-disable-next-line no-underscore-dangle
            body.signed_transaction = await TransactionFactory._userHimselfCreatesPost(user.account_name, user.private_key, body.blockchain_id, postTypeId);
        }
        return {
            eosJsV2: false,
        };
    }
}
module.exports = EosPostsInputProcessor;
