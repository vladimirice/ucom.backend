"use strict";
const entity_event_repository_1 = require("../repository/entity-event-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const JsonValueService = require("../service/json-value-service");
const PostsRepository = require("../../posts/posts-repository");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const NotificationsEventIdDictionary = require("../../entities/dictionary/notifications-event-id-dictionary");
const ActivityIndexFormulas = require("../formulas/activity-index-formulas");
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const ENTITY_NAME = OrganizationsModelProvider.getEntityName();
// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';
class OrgStatsJob {
    static async processCurrentValues() {
        const [orgIdToPosts, orgIdToFollowers] = await Promise.all([
            this.calculatePostsCurrentAmount(),
            this.calculateFollowersCurrentAmount(),
        ]);
        const orgIdToStats = this.collectAllMetricsInOne(orgIdToPosts, orgIdToFollowers);
        await this.calculateActivityIndex(orgIdToStats);
    }
    static async calculateActivityIndex(orgIdToStats) {
        const eventType = EventParamTypeDictionary.getOrgCurrentActivityIndex();
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();
        const events = [];
        for (const orgId in orgIdToStats) {
            const stats = orgIdToStats[orgId];
            const { resultValue, description } = ActivityIndexFormulas.getOrgActivityIndex(stats);
            const payload = {
                activity_index: resultValue,
                number_of_direct_posts: stats.directPosts,
                number_of_media_posts: stats.mediaPosts,
                number_of_followers: stats.followers,
            };
            events.push({
                entity_id: +orgId,
                entity_name: ENTITY_NAME,
                entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
                event_type: eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter(description, payload),
                result_value: resultValue,
            });
        }
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
    }
    static async calculateFollowersCurrentAmount() {
        const data = await UsersActivityRepository.getManyOrgsFollowers();
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        const eventType = EventParamTypeDictionary.getOrgFollowersCurrentAmount();
        const dataRes = {};
        data.forEach((item) => {
            const up = item.aggregates[NotificationsEventIdDictionary.getUserFollowsOrg()] || 0;
            const down = item.aggregates[NotificationsEventIdDictionary.getUserUnfollowsOrg()] || 0;
            const followers = up - down;
            const payload = {
                followers,
            };
            dataRes[item.entityId] = followers;
            events.push({
                entity_id: +item.entityId,
                entity_name: ENTITY_NAME,
                entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
                event_type: eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter('followers of organization', payload),
                result_value: followers,
            });
        });
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
    static async calculatePostsCurrentAmount() {
        const data = await PostsRepository.getManyOrgsPostsAmount();
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        const eventType = EventParamTypeDictionary.getOrgPostsCurrentAmount();
        const dataRes = {};
        data.forEach((item) => {
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
        });
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
    static collectAllMetricsInOne(orgIdToPosts, orgIdToFollowers) {
        const orgIdToStats = {};
        for (const orgId in orgIdToPosts) {
            this.initOrgIdToStatsIfRequired(orgIdToStats, +orgId);
            orgIdToStats[+orgId].mediaPosts = +orgIdToPosts[orgId].mediaPosts;
            orgIdToStats[+orgId].directPosts = +orgIdToPosts[orgId].directPosts;
        }
        for (const orgId in orgIdToFollowers) {
            this.initOrgIdToStatsIfRequired(orgIdToStats, +orgId);
            orgIdToStats[+orgId].followers = orgIdToFollowers[orgId];
        }
        return orgIdToStats;
    }
    static initOrgIdToStatsIfRequired(idToStats, entityId) {
        if (idToStats[entityId]) {
            return;
        }
        idToStats[entityId] = {
            mediaPosts: 0,
            directPosts: 0,
            followers: 0,
        };
    }
}
module.exports = OrgStatsJob;
