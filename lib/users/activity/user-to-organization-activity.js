"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../../api/errors");
const UsersActivityRepository = require("../repository/users-activity-repository");
const knex = require("../../../config/knex");
const UsersActivityFollowRepository = require("../repository/users-activity/users-activity-follow-repository");
const EosTransactionService = require("../../eos/eos-transaction-service");
const UserActivityService = require("../user-activity-service");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const ActivityGroupDictionary = require("../../activity/activity-group-dictionary");
const EosInputProcessor = require("../../eos/input-processor/content/eos-input-processor");
const status = require('statuses');
const ENTITY_NAME = OrganizationsModelProvider.getEntityName();
class UserToOrganizationActivity {
    static async userFollowsOrganization(userFrom, organizationId, body) {
        const activityTypeId = ucom_libs_common_1.InteractionTypesDictionary.getFollowId();
        await this.userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body);
    }
    static async userUnfollowsOrganization(userFrom, organizationId, body) {
        const activityTypeId = ucom_libs_common_1.InteractionTypesDictionary.getUnfollowId();
        await this.userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body);
    }
    static async userFollowsOrUnfollowsOrganization(userFrom, organizationId, activityTypeId, body) {
        EosInputProcessor.isSignedTransactionOrError(body);
        const activityGroupId = ActivityGroupDictionary.getGroupContentInteraction();
        await this.checkFollowPreconditions(userFrom, organizationId, activityTypeId, activityGroupId);
        const activity = await knex.transaction(async (trx) => {
            const eventId = activityTypeId === ucom_libs_common_1.InteractionTypesDictionary.getFollowId() ?
                ucom_libs_common_1.EventsIdsDictionary.getUserFollowsOrg() : ucom_libs_common_1.EventsIdsDictionary.getUserUnfollowsOrg();
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
        if (ucom_libs_common_1.EventsIdsDictionary.doesUserFollowOrg(eventId)) {
            await UsersActivityFollowRepository.insertOneFollowsOrganization(userIdFrom, orgIdTo, trx);
            return;
        }
        if (ucom_libs_common_1.EventsIdsDictionary.doesUserUnfollowOrg(eventId)) {
            const deleteRes = await UsersActivityFollowRepository.deleteOneFollowsOrg(userIdFrom, orgIdTo, trx);
            if (deleteRes === null) {
                throw new errors_1.AppError(`No record to delete. It is possible that it is a concurrency issue. User ID from: ${userIdFrom}, org ID to ${orgIdTo}`);
            }
            return;
        }
        throw new errors_1.AppError(`Unsupported eventId: ${eventId}`);
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
        const currentFollowStatus = await UsersActivityRepository.getCurrentActivity(activityGroupId, userFrom.id, orgIdTo, ENTITY_NAME);
        if (currentFollowStatus === activityTypeId) {
            throw new errors_1.BadRequestError({
                general: 'It is not possible to follow/unfollow twice',
            }, status('400'));
        }
        if (!ucom_libs_common_1.InteractionTypesDictionary.isOppositeActivityRequired(activityTypeId)) {
            return;
        }
        if (!currentFollowStatus || currentFollowStatus !== ucom_libs_common_1.InteractionTypesDictionary.getOppositeFollowActivityTypeId(activityTypeId)) {
            throw new errors_1.BadRequestError({
                general: 'It is not possible to unfollow before follow',
            }, status('400'));
        }
    }
}
module.exports = UserToOrganizationActivity;
