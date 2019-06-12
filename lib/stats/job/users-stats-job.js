"use strict";
const entity_event_repository_1 = require("../repository/entity-event-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const JsonValueService = require("../service/json-value-service");
const PostsRepository = require("../../posts/posts-repository");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const CommonStatsJob = require("./common-stats-job");
const UsersModelProvider = require("../../users/users-model-provider");
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const ENTITY_NAME = OrganizationsModelProvider.getEntityName();
// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';
class UsersStatsJob {
    static async processCurrentValues() {
        /*
          Process posts amount as for org
          TODO Process uos_accounts_properties as tags
         */
        const data = await PostsRepository.getManyUsersPostsAmount();
        const eventType = EventParamTypeDictionary.getUsersPostsCurrentAmount();
        const entityName = UsersModelProvider.getEntityName();
        const entityLabel = UsersModelProvider.getTableName();
        CommonStatsJob.calculatePostsCurrentAmount(data, eventType, entityName, entityLabel);
        await this.calculatePostsCurrentAmount();
    }
    static async calculatePostsCurrentAmount() {
        const data = await PostsRepository.getManyUsersPostsAmount();
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        const eventType = EventParamTypeDictionary.getUsersPostsCurrentAmount();
        const dataRes = {};
        for (const item of data) {
            const payload = {
                media_posts: 0,
                direct_posts: 0,
                total: 0,
            };
            for (const aggType in item.aggregates) {
                if (+aggType === ContentTypeDictionary.getTypeMediaPost()) {
                    payload.media_posts = item.aggregates[aggType];
                }
                else if (+aggType === ContentTypeDictionary.getTypeDirectPost()) {
                    payload.direct_posts = item.aggregates[aggType];
                }
            }
            payload.total = payload.media_posts + payload.direct_posts;
            dataRes[item.entityId] = {
                mediaPosts: payload.media_posts,
                directPosts: payload.direct_posts,
            };
            events.push({
                entity_id: +item.entityId,
                entity_name: ENTITY_NAME,
                entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
                event_type: eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter('media posts and direct posts amount of organization', payload),
                result_value: payload.total,
            });
        }
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
}
module.exports = UsersStatsJob;
