"use strict";
/* eslint-disable guard-for-in */
const ucom_libs_common_1 = require("ucom.libs.common");
const entity_event_repository_1 = require("../repository/entity-event-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const JsonValueService = require("../service/json-value-service");
const PostsRepository = require("../../posts/posts-repository");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const ActivityIndexFormulas = require("../formulas/activity-index-formulas");
const CommonStatsJob = require("./common-stats-job");
const CommonModelProvider = require("../../common/service/common-model-provider");
const params = {
    entityName: OrganizationsModelProvider.getEntityName(),
    entityLabel: OrganizationsModelProvider.getTableName(),
};
class OrgStatsJob {
    static async processCurrentValues() {
        const data = await PostsRepository.getManyOrgsPostsAmount();
        const eventType = EventParamTypeDictionary.getOrgPostsCurrentAmount();
        const [orgIdToPosts, orgIdToFollowers] = await Promise.all([
            CommonStatsJob.calculatePostsCurrentAmount(data, eventType, params.entityName, params.entityLabel),
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
                entity_name: params.entityName,
                entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
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
            const up = item.aggregates[ucom_libs_common_1.EventsIdsDictionary.getUserFollowsOrg()] || 0;
            const down = item.aggregates[ucom_libs_common_1.EventsIdsDictionary.getUserUnfollowsOrg()] || 0;
            const followers = up - down;
            const payload = {
                followers,
            };
            dataRes[item.entityId] = followers;
            events.push({
                entity_id: +item.entityId,
                entity_name: params.entityName,
                entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
                event_type: eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter(`followers of ${params.entityLabel}`, payload),
                result_value: followers,
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
