"use strict";
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const UsersModelProvider = require("../../users-model-provider");
const ActivityGroupDictionary = require("../../../activity/activity-group-dictionary");
const NotificationsEventIdDictionary = require("../../../entities/dictionary/notifications-event-id-dictionary");
class UsersActivityWhere {
    static getUpvoteFilter() {
        return {
            activity_type_id: InteractionTypeDictionary.getUpvoteId(),
            activity_group_id: ActivityGroupDictionary.getGroupContentInteraction(),
        };
    }
    static getDownvoteFilter() {
        return {
            activity_type_id: InteractionTypeDictionary.getDownvoteId(),
            activity_group_id: ActivityGroupDictionary.getGroupContentInteraction(),
        };
    }
    static getWhereTrustOneUser(userIdFrom, userIdTo) {
        const activityWhere = this.getWhereTrustUser();
        const entityToWhere = this.getWhereEntityUser(userIdTo);
        return Object.assign(Object.assign({ user_id_from: userIdFrom }, activityWhere), entityToWhere);
    }
    static getWhereUntrustOneUser(userIdFrom, userIdTo) {
        const activityWhere = this.getWhereUntrustUser();
        const entityToWhere = this.getWhereEntityUser(userIdTo);
        return Object.assign(Object.assign({ user_id_from: userIdFrom }, activityWhere), entityToWhere);
    }
    static getWhereEntityUser(userId) {
        return {
            entity_id_to: userId,
            entity_name: UsersModelProvider.getEntityName(),
        };
    }
    static getWhereTrustUser() {
        return {
            activity_type_id: InteractionTypeDictionary.getTrustId(),
            activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
            event_id: NotificationsEventIdDictionary.getUserTrustsYou(),
        };
    }
    static getWhereUntrustUser() {
        return {
            activity_type_id: InteractionTypeDictionary.getUntrustId(),
            activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
            event_id: NotificationsEventIdDictionary.getUserUntrustsYou(),
        };
    }
}
module.exports = UsersActivityWhere;
