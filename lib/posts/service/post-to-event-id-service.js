"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const errors_1 = require("../../api/errors");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;
class PostToEventIdService {
    static getCreateMediaPostEventId(body) {
        return body.organization_id ?
            EventsIds.userCreatesMediaPostFromOrganization() :
            EventsIds.userCreatesMediaPostFromHimself();
    }
    static getUpdatingEventIdByPost(post) {
        if (post.post_type_id === ucom_libs_common_1.ContentTypesDictionary.getTypeDirectPost()) {
            return this.getUpdateDirectPostEventId(post);
        }
        if (post.post_type_id !== ucom_libs_common_1.ContentTypesDictionary.getTypeMediaPost()) {
            return null;
        }
        if (post.organization_id === null) {
            return EventsIds.userUpdatesMediaPostFromHimself();
        }
        return EventsIds.userUpdatesMediaPostFromOrganization();
    }
    static getUpdateDirectPostEventId(post) {
        const map = {
            [EntityNames.USERS]: EventsIds.userUpdatesDirectPostForUser(),
            [EntityNames.ORGANIZATIONS]: EventsIds.userUpdatesDirectPostForOrganization(),
        };
        const eventId = map[post.entity_name_for];
        if (!eventId) {
            throw new errors_1.AppError(`Unsupported entity_name_for: ${post.entity_name_for}`);
        }
        return eventId;
    }
}
module.exports = PostToEventIdService;
