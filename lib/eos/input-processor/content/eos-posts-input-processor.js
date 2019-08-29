"use strict";
/* eslint-disable no-case-declarations */
const errors_1 = require("../../../api/errors");
const BlockchainUniqId = require("../../eos-blockchain-uniqid");
const EosContentInputProcessor = require("./eos-content-input-processor");
const EosTransactionService = require("../../eos-transaction-service");
const UsersRepository = require("../../../users/users-repository");
const OrganizationsRepository = require("../../../organizations/repository/organizations-repository");
const { TransactionFactory, ContentTypeDictionary } = require('ucom-libs-social-transactions');
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
class EosPostsInputProcessor {
    static async addSignedTransactionDetailsToBody(body, currentUser, postTypeId, organizationBlockchainId = null) {
        if (postTypeId === ContentTypeDictionary.getTypeRepost()) {
            throw new errors_1.AppError('Reposts is not supported here. Consider to use different method');
        }
        const transactionDetails = EosContentInputProcessor.getSignedTransactionFromBody(body);
        if (transactionDetails !== null) {
            body.blockchain_id = transactionDetails.blockchain_id;
            body.signed_transaction = transactionDetails.signed_transaction;
            return;
        }
        if (postTypeId === ContentTypeDictionary.getTypeDirectPost()) {
            await this.addSignedTransactionForDirectPost(body, currentUser);
            return;
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
            body.signed_transaction = await TransactionFactory._getSignedOrganizationCreatesContent(currentUser.account_name, currentUser.private_key, organizationBlockchainId, body.blockchain_id, postTypeId);
        }
        else {
            // eslint-disable-next-line no-underscore-dangle
            body.signed_transaction = await TransactionFactory._userHimselfCreatesPost(currentUser.account_name, currentUser.private_key, body.blockchain_id, postTypeId);
        }
    }
    static async addSignedTransactionDetailsToBodyForRepost(body, currentUser, parentBlockchainId) {
        const added = EosContentInputProcessor.addSignedTransactionDetailsFromRequest(body);
        if (added) {
            return;
        }
        await EosTransactionService.appendSignedUserCreatesRepost(body, currentUser, parentBlockchainId);
    }
    static async addSignedTransactionForDirectPost(body, currentUser) {
        switch (body.entity_name_for) {
            case EntityNames.USERS:
                const accountNameFor = await UsersRepository.findAccountNameById(body.entity_id_for);
                await EosTransactionService.appendSignedLegacyUserCreatesDirectPostForOtherUser(body, currentUser, accountNameFor);
                break;
            case EntityNames.ORGANIZATIONS:
                const organizationBlockchainId = await OrganizationsRepository.findBlockchainIdById(body.entity_id_for);
                await EosTransactionService.appendSignedUserCreatesDirectPostForOrg(body, currentUser, organizationBlockchainId);
                break;
            default:
                throw new errors_1.AppError(`Unsupported entity_name_for: ${body.entity_name_for}`);
        }
    }
}
module.exports = EosPostsInputProcessor;
