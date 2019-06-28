"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entity_event_repository_1 = require("../repository/entity-event-repository");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const PostsRepository = require("../../posts/posts-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const PostsStatsJob = require("../job/posts-stats-job");
const JsonValueService = require("./json-value-service");
const OrgStatsJob = require("../job/org-stats-job");
const TagsStatsJob = require("../job/tags-stats-job");
const NumbersHelper = require("../../common/helper/numbers-helper");
const UsersStatsJob = require("../job/users-stats-job");
const DEFAULT_BATCH_SIZE = 500;
const fetchSet = [
    {
        func: PostsRepository.findManyPostsEntityEvents,
        entityName: PostsModelProvider.getEntityName(),
        eventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
    },
    {
        func: OrganizationsRepository.findManyOrgsEntityEvents,
        entityName: OrganizationsModelProvider.getEntityName(),
        eventType: EventParamTypeDictionary.getCurrentBlockchainImportance(),
    },
];
class EntityJobExecutorService {
    static async processEntityEventParam(batchSize = DEFAULT_BATCH_SIZE) {
        for (const set of fetchSet) {
            console.log(`Lets process importance for entity_name: ${set.entityName}`);
            await this.processEntitiesImportance(set, batchSize);
            console.log('Importance is successfully processed.');
        }
        console.log('Lets process current values');
        await PostsStatsJob.processPostsCurrentValues();
        await OrgStatsJob.processCurrentValues();
        await TagsStatsJob.processCurrentValues(batchSize);
        await UsersStatsJob.processCurrentValues(batchSize);
    }
    static async processEntitiesImportance(fetchItem, batchSize) {
        let models = await fetchItem.func(batchSize);
        while (models.length > 0) {
            const events = this.getStatsModelFromDbModels(models, fetchItem);
            await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
            if (models.length < batchSize) {
                // in order not to make next request to get empty response
                break;
            }
            const lastId = models[models.length - 1].id;
            models = await fetchItem.func(batchSize, lastId);
        }
    }
    static getStatsModelFromDbModels(dbModels, fetchItem) {
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        for (const item of dbModels) {
            const payload = {
                importance: NumbersHelper.processFloatModelProperty(item.current_rate, 'current_rate'),
            };
            events.push({
                entity_id: item.id,
                entity_blockchain_id: item.blockchain_id,
                result_value: payload.importance,
                entity_name: fetchItem.entityName,
                event_type: fetchItem.eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: JsonValueService.getJsonValueParameter('importance', payload),
            });
        }
        return events;
    }
}
exports.EntityJobExecutorService = EntityJobExecutorService;
