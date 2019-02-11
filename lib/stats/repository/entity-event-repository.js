"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knexEvents = require("../../../config/knex-events");
const OrganizationsModelProvider = require("../../organizations/service/organizations-model-provider");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const TagsModelProvider = require("../../tags/service/tags-model-provider");
const TABLE_NAME = 'entity_event_param';
class EntityEventRepository {
    static async findManyEventsWithTagEntityName() {
        return this.findManyEventsByEntityName(TagsModelProvider.getEntityName());
    }
    static async findManyEventsWithOrgEntityName() {
        return this.findManyEventsByEntityName(OrganizationsModelProvider.getEntityName());
    }
    static async findManyEventsWithPostEntityName(eventType = null) {
        return this.findManyEventsByEntityName(PostsModelProvider.getEntityName(), eventType);
    }
    static async insertManyEvents(events) {
        await knexEvents(TABLE_NAME).insert(events);
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
}
exports.EntityEventRepository = EntityEventRepository;
