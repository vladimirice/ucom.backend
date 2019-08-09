"use strict";
const UsersActivityRepository = require("../repository/users-activity-repository");
const knex = require("../../../config/knex");
const NotificationsEventIdDictionary = require("../../entities/dictionary/notifications-event-id-dictionary");
const UsersActivityFollowRepository = require("../repository/users-activity/users-activity-follow-repository");
const EosTransactionService = require("../../eos/eos-transaction-service");
const UserActivityService = require("../user-activity-service");
const status = require('statuses');
const { TransactionFactory, InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const usersActivityRepository = require('../../users/repository').Activity;
const orgModelProvider = require('../../organizations/service').ModelProvider;
const activityGroupDictionary = require('../../activity/activity-group-dictionary');
const { BadRequestError, AppError } = require('../../api/errors');
const organizationsRepositories = require('../../organizations/repository');
const eventIdDictionary = require('../../entities/dictionary').EventId;
const ENTITY_NAME = orgModelProvider.getEntityName();
class UserToOrganizationActivity {
    static async userFollowsOrganization(userFrom, organizationId, body) {
        const activityTypeId = InteractionTypeDictionary.getFollowId();
        await this.userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body);
    }
    static async userUnfollowsOrganization(userFrom, organizationId, body) {
        const activityTypeId = InteractionTypeDictionary.getUnfollowId();
        await this.userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body);
    }
    static async userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body) {
        await this.addSignedTransactionsForOrganizationFollowing(body, userFrom, organizationId, activityTypeId);
        const activityGroupId = activityGroupDictionary.getGroupContentInteraction();
        await this.checkFollowPreconditions(userFrom, organizationId, activityTypeId, activityGroupId);
        const activity = await knex.transaction(async (trx) => {
            const eventId = activityTypeId === InteractionTypeDictionary.getFollowId() ?
                eventIdDictionary.getUserFollowsOrg() : eventIdDictionary.getUserUnfollowsOrg();
            await this.createFollowIndex(eventId, userFrom.id, organizationId, trx);
            const newActivityData = {
                activity_type_id: activityTypeId,
                user_id_from: userFrom.id,
                entity_id_to: organizationId,
                signed_transaction: body.signed_transaction,
                entity_name: ENTITY_NAME,
                activity_group_id: activityGroupId,
                event_id: eventId,
            };
            return UsersActivityRepository.createNewKnexActivity(newActivityData, trx);
        });
        const options = EosTransactionService.getEosVersionBasedOnSignedTransaction(body.signed_transaction);
        await UserActivityService.sendPayloadToRabbitWithOptions(activity, options);
    }
    static async createFollowIndex(eventId, userIdFrom, orgIdTo, trx) {
        if (NotificationsEventIdDictionary.doesUserFollowOrg(eventId)) {
            await UsersActivityFollowRepository.insertOneFollowsOrganization(userIdFrom, orgIdTo, trx);
            return;
        }
        if (NotificationsEventIdDictionary.doesUserUnfollowOrg(eventId)) {
            const deleteRes = await UsersActivityFollowRepository.deleteOneFollowsOrg(userIdFrom, orgIdTo, trx);
            if (deleteRes === null) {
                throw new AppError(`No record to delete. It is possible that it is a concurrency issue. User ID from: ${userIdFrom}, org ID to ${orgIdTo}`);
            }
            return;
        }
        throw new AppError(`Unsupported eventId: ${eventId}`);
    }
    /**
     *
     * @param {Object} userFrom
     * @param {number} orgIdTo
     * @param {number} activityTypeId
     * @param {number} activityGroupId
     * @returns {Promise<void>}
     * @private
     */
    static async checkFollowPreconditions(userFrom, orgIdTo, activityTypeId, activityGroupId) {
        const currentFollowStatus = await usersActivityRepository.getCurrentActivity(activityGroupId, userFrom.id, orgIdTo, ENTITY_NAME);
        if (currentFollowStatus === activityTypeId) {
            throw new BadRequestError({
                general: 'It is not possible to follow/unfollow twice',
            }, status('400'));
        }
        if (!InteractionTypeDictionary.isOppositeActivityRequired(activityTypeId)) {
            return;
        }
        if (!currentFollowStatus || currentFollowStatus !== InteractionTypeDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
            throw new BadRequestError({
                general: 'It is not possible to unfollow before follow',
            }, status('400'));
        }
    }
    /**
     * Remove this after signing transactions on frontend
     *
     * @param   {Object} body
     * @param   {Object} currentUser
     * @param   {number} orgId
     * @param   {number} activityTypeId
     * @return  {Promise<void>}
     * @private
     */
    static async addSignedTransactionsForOrganizationFollowing(body, currentUser, orgId, activityTypeId) {
        if (body.signed_transaction) {
            return;
        }
        const blockchainId = await organizationsRepositories.Main.findBlockchainIdById(orgId);
        if (!blockchainId) {
            throw new AppError(`There is no blockchainId for orgId: ${orgId}`);
        }
        if (activityTypeId === InteractionTypeDictionary.getFollowId()) {
            body.signed_transaction = await TransactionFactory.getSignedUserFollowsOrg(currentUser.account_name, currentUser.private_key, blockchainId);
        }
        else {
            body.signed_transaction = await TransactionFactory.getSignedUserUnfollowsOrg(currentUser.account_name, currentUser.private_key, blockchainId);
        }
    }
}
module.exports = UserToOrganizationActivity;
