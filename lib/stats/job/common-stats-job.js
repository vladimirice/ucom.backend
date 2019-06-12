"use strict";
const entity_event_repository_1 = require("../repository/entity-event-repository");
const errors_1 = require("../../api/errors");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const CommonModelProvider = require("../../common/service/common-model-provider");
const JsonValueService = require("../service/json-value-service");
const { PostTypes } = require('ucom.libs.common').Posts.Dictionary;
class CommonStatsJob {
    static async calculatePostsCurrentAmount(data, eventType, entityName, entityLabel) {
        const events = [];
        const dataRes = {};
        for (const item of data) {
            const payload = this.processAggregatePostTypes(item);
            dataRes[item.entityId] = {
                mediaPosts: payload.media_posts,
                directPosts: payload.direct_posts,
            };
            events.push({
                entity_id: item.entityId,
                entity_name: entityName,
                event_type: eventType,
                json_value: JsonValueService.getJsonValueParameter(`media posts and direct posts amount of ${entityLabel}`, payload),
                result_value: payload.total,
                event_group: EventParamGroupDictionary.getNotDetermined(),
                event_super_group: EventParamSuperGroupDictionary.getNotDetermined(),
                entity_blockchain_id: CommonModelProvider.getFakeBlockchainId(),
            });
        }
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
        return dataRes;
    }
    static processAggregatePostTypes(item) {
        const postTypeToKey = {
            [PostTypes.MEDIA]: 'media_posts',
            [PostTypes.DIRECT]: 'direct_posts',
        };
        const payload = {
            media_posts: 0,
            direct_posts: 0,
            total: 0,
        };
        for (const aggType in item.aggregates) {
            if (!item.aggregates.hasOwnProperty(aggType)) {
                continue;
            }
            const key = postTypeToKey[+aggType];
            if (!key) {
                throw new errors_1.AppError(`aggType ${aggType} is not supported`);
            }
            payload[key] = item.aggregates[aggType];
        }
        payload.total = payload.media_posts + payload.direct_posts;
        return payload;
    }
}
module.exports = CommonStatsJob;
