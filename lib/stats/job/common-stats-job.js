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
    static async saveCurrentValues(params, batchSize) {
        let models = await params.currentValuesFetchFunction(batchSize);
        while (models.length > 0) {
            const events = this.getStatsModelFromDbModels(models, params);
            await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
            if (models.length < batchSize) {
                // in order not to make next request to get empty response
                break;
            }
            const lastId = models[models.length - 1].id;
            models = await params.currentValuesFetchFunction(batchSize, lastId);
        }
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
    static getStatsModelFromDbModels(dbModels, params) {
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        for (const item of dbModels) {
            const payload = {};
            for (const paramName of params.currentValuesToSave) {
                payload[paramName] = item[paramName];
            }
            events.push({
                entity_id: item.entity_id,
                entity_blockchain_id: item.account_name,
                event_type: params.currentValuesEventType,
                json_value: JsonValueService.getJsonValueParameter(`${params.entityLabel} current amounts`, payload),
                entity_name: params.entityName,
                result_value: 0,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
            });
        }
        return events;
    }
}
module.exports = CommonStatsJob;
