"use strict";
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const OrganizationsToEntitiesRelations = require("../dictionary/OrganizationsToEntitiesRelations");
const knex = require("../../../config/knex");
const QueryFilterService = require("../../api/filters/query-filter-service");
const TABLE_NAME = 'organizations_to_entities';
class OrganizationsToEntitiesRepository {
    static async findManyDiscussions(orgId) {
        const entityName = PostsModelProvider.getEntityName();
        const relationType = OrganizationsToEntitiesRelations.discussions();
        const posts = PostsModelProvider.getTableName();
        const postsStats = PostsModelProvider.getPostsStatsTableName();
        const toSelect = QueryFilterService.getPrefixedAttributes(PostsModelProvider.getPostsFieldsForCard(), posts, false);
        return knex(TABLE_NAME)
            .select(toSelect)
            .innerJoin(posts, function () {
            // @ts-ignore
            this.on(`${posts}.id`, '=', `${TABLE_NAME}.entity_id`)
                .andOn(knex.raw(`${TABLE_NAME}.entity_name = '${entityName}'`))
                .andOn(knex.raw(`${TABLE_NAME}.organization_id = ${orgId}`))
                .andOn(knex.raw(`${TABLE_NAME}.relation_type = ${relationType}`));
        })
            .innerJoin(postsStats, `${posts}.id`, `${postsStats}.post_id`)
            .orderByRaw(`${TABLE_NAME}.id ASC`);
    }
    static async updateDiscussionsState(orgId, postsIds, trx) {
        const entityName = PostsModelProvider.getEntityName();
        const relationType = OrganizationsToEntitiesRelations.discussions();
        await trx(TABLE_NAME)
            .where({
            organization_id: orgId,
            entity_name: entityName,
            relation_type: relationType,
        })
            .delete();
        const toInsert = [];
        for (const id of postsIds) {
            toInsert.push({
                organization_id: orgId,
                entity_name: entityName,
                relation_type: relationType,
                entity_id: id,
            });
        }
        await trx(TABLE_NAME).insert(toInsert);
    }
}
module.exports = OrganizationsToEntitiesRepository;
