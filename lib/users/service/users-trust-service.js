"use strict";
const errors_1 = require("../../api/errors");
const UsersRepository = require("../users-repository");
const ActivityGroupDictionary = require("../../activity/activity-group-dictionary");
const UsersModelProvider = require("../users-model-provider");
const NotificationsEventIdDictionary = require("../../entities/dictionary/notifications-event-id-dictionary");
const UsersActivityRepository = require("../repository/users-activity-repository");
const knex = require("../../../config/knex");
const UsersActivityTrustRepository = require("../repository/users-activity/users-activity-trust-repository");
const SignedTransactionValidator = require("../../eos/validator/signed-transaction-validator");
const ActivityProducer = require("../../jobs/activity-producer");
const UserActivitySerializer = require("../job/user-activity-serializer");
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
class UsersTrustService {
    static async trustUser(userFrom, userIdTo, body) {
        const activityTypeId = InteractionTypeDictionary.getTrustId();
        const eventId = NotificationsEventIdDictionary.getUserTrustsYou();
        await this.trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId);
    }
    static async untrustUser(userFrom, userIdTo, body) {
        const activityTypeId = InteractionTypeDictionary.getUntrustId();
        const eventId = NotificationsEventIdDictionary.getUserUntrustsYou();
        await this.trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId);
    }
    static async trustOrUntrustUser(userFrom, userIdTo, body, activityTypeId, eventId) {
        await this.checkPreconditions(userFrom, userIdTo, activityTypeId, body);
        const activity = await knex.transaction(async (trx) => {
            const newActivity = await this.createTrustOrUntrustUserActivity(activityTypeId, eventId, body.signed_transaction, userFrom.id, userIdTo, trx);
            if (NotificationsEventIdDictionary.isUserTrustsYou(eventId)) {
                await UsersActivityTrustRepository.insertOneTrustUser(userFrom.id, userIdTo, trx);
            }
            else if (NotificationsEventIdDictionary.isUserUntrustsYou(eventId)) {
                const deleteRes = await UsersActivityTrustRepository.deleteOneTrustUser(userFrom.id, userIdTo, trx);
                if (deleteRes === null) {
                    throw new errors_1.AppError(`No record to delete. It is possible that it is concurrency. User ID from: ${userFrom.id}, user ID to ${userIdTo}`);
                }
            }
            else {
                throw new errors_1.AppError(`Unsupported eventId: ${eventId}`);
            }
            return newActivity;
        });
        const job = UserActivitySerializer.createJobWithOnlyEosJsV2Option(activity.id);
        await ActivityProducer.publishWithUserActivity(job);
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
        if (isTrust !== null && activityTypeId !== InteractionTypeDictionary.getUntrustId()) {
            throw new errors_1.BadRequestError(`User with ID ${userFrom.id} already trusts user with ID ${userIdTo}. Only untrust activity is allowed`);
        }
        if (isTrust === null && activityTypeId !== InteractionTypeDictionary.getTrustId()) {
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
