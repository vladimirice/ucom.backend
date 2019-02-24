"use strict";
const entity_event_repository_1 = require("../repository/entity-event-repository");
const TagsRepository = require("../../tags/repository/tags-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const JsonValueService = require("../service/json-value-service");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const ActivityIndexFormulas = require("../formulas/activity-index-formulas");
const ENTITY_NAME = TagsModelProvider.getEntityName();
// #task determine entity blockchain ID for all cases
const NOT_DETERMINED_BLOCKCHAIN_ID = 'not-determined-id';
class TagsStatsJob {
    static async processCurrentValues(batchSize) {
        const tagsData = await this.calculateTagItselfCurrentValues(batchSize);
        await this.calculateActivityIndex(tagsData);
    }
    static async calculateActivityIndex(tagsData) {
        const eventType = EventParamTypeDictionary.getTagCurrentActivityIndex();
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamGroupDictionary.getNotDetermined();
        const events = [];
        for (const tag of tagsData) {
            const { resultValue, description } = ActivityIndexFormulas.getTagsActivityIndex(tag);
            const payload = {
                activity_index: resultValue,
                number_of_direct_posts: tag.current_direct_posts_amount,
                number_of_media_posts: tag.current_media_posts_amount,
                number_of_followers: tag.current_followers_amount,
            };
            events.push({
                entity_id: +tag.id,
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
    static async calculateTagItselfCurrentValues(batchSize) {
        let allModels = [];
        let models = await TagsRepository.findManyTagsEntityEvents(batchSize);
        while (models.length > 0) {
            allModels = Array.prototype.concat(allModels, models);
            const events = this.getStatsModelFromDbModels(models);
            await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
            if (models.length < batchSize) {
                // in order not to make next request to get empty response
                break;
            }
            const lastId = models[models.length - 1].id;
            models = await TagsRepository.findManyTagsEntityEvents(batchSize, lastId);
        }
        return allModels;
    }
    static getStatsModelFromDbModels(dbModels) {
        const events = [];
        const eventType = EventParamTypeDictionary.getTagItselfCurrentAmounts();
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        dbModels.forEach((item) => {
            const payload = {
                current_posts_amount: item.current_posts_amount,
                current_media_posts_amount: item.current_media_posts_amount,
                current_direct_posts_amount: item.current_direct_posts_amount,
                current_followers_amount: item.current_followers_amount,
                importance: +item.current_rate,
            };
            events.push({
                entity_id: item.id,
                entity_name: ENTITY_NAME,
                entity_blockchain_id: NOT_DETERMINED_BLOCKCHAIN_ID,
                event_type: eventType,
                event_group: eventGroup,
                result_value: 0,
                event_super_group: eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter('tag itself current amounts', payload),
            });
        });
        return events;
    }
}
module.exports = TagsStatsJob;
