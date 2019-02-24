"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knexEvents = require("../../../config/knex-events");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const TABLE_NAME = 'entity_event_param';
class EntityEventRepository {
    static async findManyEventsWithTagEntityName(eventType = null) {
        return this.findManyEventsByEntityName(TagsModelProvider.getEntityName(), eventType);
    }
    static async findManyEventsWithOrgEntityName(eventType = null) {
        return this.findManyEventsByEntityName(OrganizationsModelProvider.getEntityName(), eventType);
    }
    static async findManyEventsWithPostEntityName(eventType = null) {
        return this.findManyEventsByEntityName(PostsModelProvider.getEntityName(), eventType);
    }
    static async insertManyEvents(events) {
        await knexEvents.batchInsert(TABLE_NAME, events);
    }
    static async findManyEventsByEntityName(entityName, eventType = null) {
        const where = {
            entity_name: entityName,
        };
        if (eventType !== null) {
            where.event_type = +eventType;
        }
        return knexEvents(TABLE_NAME)
            .where(where);
    }
    /**
     *
     * @param {string} where
     * @return {Promise<Object[]>}
     */
    static async findLastRowsGroupedByEntity(where) {
        return knexEvents(TABLE_NAME).distinct(knexEvents.raw('ON (entity_id, event_type) entity_id, json_value, entity_name, entity_blockchain_id'))
            .whereRaw(where)
            .orderBy('entity_id')
            .orderBy('event_type')
            .orderBy('id', 'DESC');
    }
}
exports.EntityEventRepository = EntityEventRepository;
