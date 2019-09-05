"use strict";
const UsersModelProvider = require("../../users-model-provider");
const ActivityGroupDictionary = require("../../../activity/activity-group-dictionary");
const NotificationsEventIdDictionary = require("../../../entities/dictionary/notifications-event-id-dictionary");
const ucom_libs_common_1 = require("ucom.libs.common");
class UsersActivityWhere {
    static getUpvoteFilter() {
        return {
            activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getUpvoteId(),
            activity_group_id: ActivityGroupDictionary.getGroupContentInteraction(),
        };
    }
    static getDownvoteFilter() {
        return {
            activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getDownvoteId(),
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
            activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getTrustId(),
            activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
            event_id: NotificationsEventIdDictionary.getUserTrustsYou(),
        };
    }
    static getWhereUntrustUser() {
        return {
            activity_type_id: ucom_libs_common_1.InteractionTypesDictionary.getUntrustId(),
            activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
            event_id: NotificationsEventIdDictionary.getUserUntrustsYou(),
        };
    }
}
module.exports = UsersActivityWhere;
