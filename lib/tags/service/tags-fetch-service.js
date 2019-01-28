"use strict";
const moment = require('moment');
const postsFetchService = require('../../posts/service/posts-fetch-service');
const usersFetchService = require('../../users/service/users-fetch-service');
const organizationsFetchService = require('../../organizations/service/organizations-fetch-service');
const apiPostProcessor = require('../../common/service/api-post-processor');
class TagsFetchService {
    static async findAndProcessOneTagById(dbTag, tagTitle, currentUserId) {
        // #task - should be provided by frontend
        const wallFeedQuery = {
            page: 1,
            per_page: 10,
        };
        const relatedEntitiesQuery = {
            page: 1,
            per_page: 5,
            v2: true,
        };
        const [posts, users, orgs] = await Promise.all([
            postsFetchService.findAndProcessAllForTagWallFeed(tagTitle, currentUserId, wallFeedQuery),
            usersFetchService.findAllAndProcessForListByTagTitle(tagTitle, relatedEntitiesQuery, currentUserId),
            organizationsFetchService.findAndProcessAllByTagTitle(tagTitle, relatedEntitiesQuery),
        ]);
        apiPostProcessor.processOneTag(dbTag);
        return {
            posts,
            users,
            orgs,
            id: dbTag.id,
            title: dbTag.title,
            created_at: moment(dbTag.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
            current_rate: dbTag.current_rate,
        };
    }
}
module.exports = TagsFetchService;
