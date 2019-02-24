"use strict";
const QueryFilterService = require("../../api/filters/query-filter-service");
const TagsRepository = require("../repository/tags-repository");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const moment = require('moment');
const postsFetchService = require('../../posts/service/posts-fetch-service');
const usersFetchService = require('../../users/service/users-fetch-service');
const organizationsFetchService = require('../../organizations/service/organizations-fetch-service');
const apiPostProcessor = require('../../common/service/api-post-processor');
class TagsFetchService {
    static async findAndProcessManyTags(query) {
        const repository = TagsRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository, true);
        const promises = [
            TagsRepository.findManyTagsForList(params),
            TagsRepository.countManyTagsForList(params),
        ];
        return this.findAndProcessManyByParams(promises, query, params);
    }
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
        // noinspection TypeScriptValidateJSTypes
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
    static async findAndProcessManyByParams(promises, query, params) {
        // @ts-ignore
        const [data, totalAmount] = await Promise.all(promises);
        ApiPostProcessor.processManyTags(data);
        const metadata = QueryFilterService.getMetadata(totalAmount, query, params);
        return {
            data,
            metadata,
        };
    }
}
module.exports = TagsFetchService;
