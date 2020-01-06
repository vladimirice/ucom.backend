"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../../api/errors");
const UsersRepository = require("../users-repository");
const ActivityGroupDictionary = require("../../activity/activity-group-dictionary");
const UsersModelProvider = require("../users-model-provider");
const UsersActivityRepository = require("../repository/users-activity-repository");
const knex = require("../../../config/knex");
const UsersActivityTrustRepository = require("../repository/users-activity/users-activity-trust-repository");
const SignedTransactionValidator = require("../../eos/validator/signed-transaction-validator");
const ActivityProducer = require("../../jobs/activity-producer");
const UserActivitySerializer = require("../job/user-activity-serializer");
const AutoUpdateCreatorService = require("../../posts/service/auto-update-creator-service");
class UsersTrustService {
    static async trustUser(userFrom, userIdTo, body) {
        const activityTypeId = ucom_libs_common_1.InteractionTypesDictionary.getTrustId();
        const eventId = ucom_libs_common_1.EventsIdsDictionary.getUserTrustsYou();
        await this.trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId);
    }
    static async untrustUser(userFrom, userIdTo, body) {
        const activityTypeId = ucom_libs_common_1.InteractionTypesDictionary.getUntrustId();
        const eventId = ucom_libs_common_1.EventsIdsDictionary.getUserUntrustsYou();
        await this.trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId);
    }
    static async trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId) {
        await this.checkPreconditions(userFrom, userIdTo, activityTypeId, body);
        const activity = await this.processAndGetNewActivity(userFrom, userIdTo, eventId, activityTypeId, body);
        const job = UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await ActivityProducer.publishWithUserActivity(job);
    }
    static async processAndGetNewActivity(userFrom, userIdTo, eventId, activityTypeId, body) {
        return knex.transaction(async (transaction) => {
            const promises = [
                await this.createTrustOrUntrustUserActivity(activityTypeId, eventId, body.signed_transaction, userFrom.id, userIdTo, transaction),
                this.processTrustIndex(userFrom.id, userIdTo, eventId, transaction),
            ];
            if (body.blockchain_id) {
                promises.push(AutoUpdateCreatorService.createUserToUser(transaction, userFrom, userIdTo, body.blockchain_id, eventId));
            }
            const [newActivity] = await Promise.all(promises);
            return newActivity;
        });
    }
    static async processTrustIndex(userIdFrom, userIdTo, eventId, transaction) {
        if (ucom_libs_common_1.EventsIdsDictionary.isUserTrustsYou(eventId)) {
            await UsersActivityTrustRepository.insertOneTrustUser(userIdFrom, userIdTo, transaction);
        }
        else if (ucom_libs_common_1.EventsIdsDictionary.isUserUntrustsYou(eventId)) {
            const deleteRes = await UsersActivityTrustRepository.deleteOneTrustUser(userIdFrom, userIdTo, transaction);
            if (deleteRes === null) {
                throw new errors_1.AppError(`No record to delete. It is possible that it is concurrency. User ID from: ${userIdFrom}, user ID to ${userIdTo}`);
            }
        }
        else {
            throw new errors_1.AppError(`Unsupported eventId: ${eventId}`);
        }
    }
    static async checkPreconditions(userFrom, userIdTo, activityTypeId, body) {
        if (userFrom.id === userIdTo) {
            throw new errors_1.BadRequestError({
                general: 'It is not possible to trust or untrust yourself',
            }, 400);
        }
        SignedTransactionValidator.validateBodyWithBadRequestError(body);
        const [userToAccountName, isTrust] = await Promise.all([
            UsersRepository.findAccountNameById(userIdTo),
            UsersActivityTrustRepository.getUserTrustUser(userFrom.id, userIdTo),
        ]);
        if (!userToAccountName) {
            throw new errors_1.BadRequestError(`There is no user with ID: ${userIdTo}`, 404);
        }
        if (isTrust !== null && activityTypeId !== ucom_libs_common_1.InteractionTypesDictionary.getUntrustId()) {
            throw new errors_1.BadRequestError(`User with ID ${userFrom.id} already trusts user with ID ${userIdTo}. Only untrust activity is allowed`);
        }
        if (isTrust === null && activityTypeId !== ucom_libs_common_1.InteractionTypesDictionary.getTrustId()) {
            throw new errors_1.BadRequestError(`User with ID ${userFrom.id} does not trust user with ID ${userIdTo}. Only trust activity is allowed`);
        }
    }
    static async createTrustOrUntrustUserActivity(activityTypeId, eventId, signedTransaction, currentUserId, userIdTo, trx) {
        const activityGroupId = ActivityGroupDictionary.getGroupUserUserInteraction();
        const entityName = UsersModelProvider.getEntityName();
        const data = {
            activity_type_id: activityTypeId,
            activity_group_id: activityGroupId,
            user_id_from: currentUserId,
            entity_id_to: userIdTo,
            entity_name: entityName,
            signed_transaction: signedTransaction,
            event_id: eventId,
        };
        return UsersActivityRepository.createNewKnexActivity(data, trx);
    }
}
module.exports = UsersTrustService;
