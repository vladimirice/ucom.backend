"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knexEvents = require("../../../config/knex-events");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const knex = require("../../../config/knex");
const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';
class EntityJobExecutorService {
    static getImportanceJsonData(data) {
        return {
            importance: data,
        };
    }
    static getStatsModelFromDbModels(dbModels) {
        const events = [];
        // TODO
        const EVENT_TYPE = 1;
        // TODO
        const EVENT_GROUP = 1;
        dbModels.forEach((item) => {
            events.push({
                entity_id: item.id,
                entity_name: PostsModelProvider.getEntityName(),
                entity_blockchain_id: item.blockchain_id,
                event_type: EVENT_TYPE,
                event_group: EVENT_GROUP,
                json_value: this.getImportanceJsonData(item.current_rate),
            });
        });
        return events;
    }
    static async getPostsWithRates() {
        // TODO - batch
        return knex('posts')
            .select([
            'id',
            'blockchain_id',
            'current_rate',
        ]);
    }
    static async processEntityEventParam() {
        const data = await this.getPostsWithRates();
        const events = this.getStatsModelFromDbModels(data);
        // Fetch one posts current rate and write it like importance worker does
        await knexEvents(ENTITY_EVENT_TABLE_NAME).insert(events);
    }
}
exports.EntityJobExecutorService = EntityJobExecutorService;
