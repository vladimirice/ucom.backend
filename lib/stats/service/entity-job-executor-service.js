"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knexEvents = require("../../../config/knex-events");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const ENTITY_EVENT_TABLE_NAME = 'entity_event_param';
class EntityJobExecutorService {
    static async processEntityEventParam() {
        // Fetch one posts current rate and write it like importance worker does
        const events = [
            {
                entity_id: 1,
                entity_name: OrganizationsModelProvider.getEntityName(),
                entity_blockchain_id: 'sample_blockchain_id_1',
                event_type: 2,
                event_group: 1,
                json_value: { key1: 'value1' },
            },
            {
                entity_id: 2,
                entity_name: PostsModelProvider.getEntityName(),
                entity_blockchain_id: 'sample_blockchain_id_2',
                event_type: 3,
                event_group: 1,
                json_value: { key2: 'value2' },
            },
        ];
        await knexEvents(ENTITY_EVENT_TABLE_NAME).insert(events);
    }
}
exports.EntityJobExecutorService = EntityJobExecutorService;
