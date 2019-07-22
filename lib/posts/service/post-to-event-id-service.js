"use strict";
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
class PostToEventIdService {
    static getCreateMediaPostEventId(body) {
        return body.organization_id ?
            EventsIds.userCreatesMediaPostFromOrganization() :
            EventsIds.userCreatesMediaPostFromHimself();
    }
    static getUpdatingEventIdByPost(post) {
        if (post.post_type_id !== ContentTypeDictionary.getTypeMediaPost()) {
            return null;
        }
        if (post.organization_id === null) {
            return EventsIds.userUpdatesMediaPostFromHimself();
        }
        return EventsIds.userUpdatesMediaPostFromOrganization();
    }
}
module.exports = PostToEventIdService;
