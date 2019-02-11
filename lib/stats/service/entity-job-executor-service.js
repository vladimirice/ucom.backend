"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entity_event_repository_1 = require("../repository/entity-event-repository");
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const PostsRepository = require("../../posts/posts-repository");
const EventParamGroupDictionary = require("../dictionary/event-param/event-param-group-dictionary");
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const EventParamSuperGroupDictionary = require("../dictionary/event-param/event-param-super-group-dictionary");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const TagsRepository = require("../../tags/repository/tags-repository");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const DEFAULT_BATCH_SIZE = 500;
const DEFAULT_WORKER_RECALC_PERIOD = '1h';
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
    {
        func: TagsRepository.findManyTagsEntityEvents,
        entityName: TagsModelProvider.getEntityName(),
        eventType: EventParamTypeDictionary.getBackendCalculatedImportance(),
    },
];
class EntityJobExecutorService {
    static async processEntityEventParam(batchSize = DEFAULT_BATCH_SIZE) {
        for (let i = 0; i < fetchSet.length; i += 1) {
            console.log(`Lets process importance for entity_name: ${fetchSet[i].entityName}`);
            await this.processEntities(fetchSet[i], batchSize);
            console.log('Importance is successfully processed.');
        }
        console.log('Lets process posts votes');
        await this.calculatePostsVotes();
        console.log('Finished');
    }
    static processAggValue(aggregate, payload) {
        if (!aggregate) {
            return;
        }
        const [activityType, value] = aggregate.split('__');
        if (+activityType === InteractionTypeDictionary.getUpvoteId()) {
            payload.upvotes = +value;
        }
        else {
            payload.downvotes = +value;
        }
    }
    static async calculatePostsVotes() {
        const data = await UsersActivityRepository.getPostsVotes();
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        const eventType = EventParamTypeDictionary.getCurrentPostVotes();
        data.forEach((item) => {
            const payload = {
                upvotes: 0,
                downvotes: 0,
            };
            const [aggOne, aggTwo] = item.array_agg;
            this.processAggValue(aggOne, payload);
            this.processAggValue(aggTwo, payload);
            events.push({
                entity_id: +item.entity_id_to,
                entity_name: PostsModelProvider.getEntityName(),
                entity_blockchain_id: 'not-determined-id',
                event_type: eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: this.getParameterJsonData('upvote_downvote', payload),
            });
        });
        await entity_event_repository_1.EntityEventRepository.insertManyEvents(events);
    }
    static async processEntities(fetchItem, batchSize) {
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
    static getImportanceJsonData(importance) {
        return {
            worker_recalc_period: DEFAULT_WORKER_RECALC_PERIOD,
            description: 'fetch and save current value',
            data: {
                importance,
            },
        };
    }
    static getParameterJsonData(fieldName, data) {
        return {
            worker_recalc_period: DEFAULT_WORKER_RECALC_PERIOD,
            description: `fetch and save current value of ${fieldName}`,
            data,
        };
    }
    static getStatsModelFromDbModels(dbModels, fetchItem) {
        const events = [];
        const eventGroup = EventParamGroupDictionary.getNotDetermined();
        const eventSuperGroup = EventParamSuperGroupDictionary.getNotDetermined();
        dbModels.forEach((item) => {
            events.push({
                entity_id: item.id,
                entity_name: fetchItem.entityName,
                entity_blockchain_id: item.blockchain_id,
                event_type: fetchItem.eventType,
                event_group: eventGroup,
                event_super_group: eventSuperGroup,
                json_value: this.getImportanceJsonData(item.current_rate),
            });
        });
        return events;
    }
}
exports.EntityJobExecutorService = EntityJobExecutorService;
