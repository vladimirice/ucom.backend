"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const UsersActivityEventsViewRepository = require("../../users/repository/users-activity/users-activity-events-view-repository");
class ApiPostEvents {
    static async processForPostAndChangeProps(currentUserId, postModelResponse, request) {
        await UsersActivityEventsViewRepository.insertOneView(currentUserId, postModelResponse.id, ucom_libs_common_1.EntityNames.POSTS, request.headers);
        this.incrementViewsCount(postModelResponse);
    }
    static async processForOrganizationAndChangeProps(currentUserId, organization, request) {
        await UsersActivityEventsViewRepository.insertOneView(currentUserId, organization.id, ucom_libs_common_1.EntityNames.ORGANIZATIONS, request.headers);
        this.incrementViewsCount(organization);
    }
    static async processForTagAndChangeProps(currentUserId, tag, request) {
        await UsersActivityEventsViewRepository.insertOneView(currentUserId, tag.id, ucom_libs_common_1.EntityNames.TAGS, request.headers);
        this.incrementViewsCount(tag);
    }
    static async processForUserProfileAndChangeProps(currentUserId, user, request) {
        await UsersActivityEventsViewRepository.insertOneView(currentUserId, user.id, ucom_libs_common_1.EntityNames.USERS, request.headers);
        this.incrementViewsCount(user);
    }
    static incrementViewsCount(entity) {
        entity.views_count += 1;
    }
}
module.exports = ApiPostEvents;
