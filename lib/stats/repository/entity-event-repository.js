"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knexEvents = require("../../../config/knex-events");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const CommonModelProvider = require("../../common/service/common-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = 'entity_event_param';
class EntityEventRepository {
    static async findManyEventsWithTagEntityName(eventType = null) {
        return this.findManyEventsByEntityName(TagsModelProvider.getEntityName(), eventType);
    }
    static async findManyEventsWithOrgEntityName(eventType = null) {
        return this.findManyEventsByEntityName(OrganizationsModelProvider.getEntityName(), eventType);
    }
    static async findOneEventOfTotals(eventType) {
        const where = {
            entity_name: CommonModelProvider.getEntityName(),
            event_type: eventType,
        };
        const data = await knexEvents(TABLE_NAME)
            .where(where)
            .first();
        if (!data) {
            return null;
        }
        RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());
        return data;
    }
    static async findManyEventsWithPostEntityName(eventType = null) {
        return this.findManyEventsByEntityName(PostsModelProvider.getEntityName(), eventType);
    }
    static async insertOneEvent(event) {
        await knexEvents(TABLE_NAME).insert(event);
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
        return knexEvents(TABLE_NAME).distinct(knexEvents.raw('ON (entity_id, event_type) entity_id, json_value, entity_name, entity_blockchain_id, result_value'))
            .whereRaw(where)
            .orderBy('entity_id')
            .orderBy('event_type')
            .orderBy('id', 'DESC');
    }
    static getNumericalFields() {
        return [
            'id',
            'entity_id',
            'result_value',
        ];
    }
}
exports.EntityEventRepository = EntityEventRepository;
