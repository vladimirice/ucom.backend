"use strict";
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const OrganizationsToEntitiesRelations = require("../dictionary/OrganizationsToEntitiesRelations");
const knex = require("../../../config/knex");
const QueryFilterService = require("../../api/filters/query-filter-service");
const UsersModelProvider = require("../../users/users-model-provider");
const RepositoryHelper = require("../../common/repository/repository-helper");
const TABLE_NAME = 'organizations_to_entities';
class OrganizationsToEntitiesRepository {
    static async findManyDiscussions(orgId) {
        const entityName = PostsModelProvider.getEntityName();
        const relationType = OrganizationsToEntitiesRelations.discussions();
        const posts = PostsModelProvider.getTableName();
        const postsStats = PostsModelProvider.getPostsStatsTableName();
        const users = UsersModelProvider.getTableName();
        let toSelect = QueryFilterService.getPrefixedAttributes(PostsModelProvider.getPostsFieldsForCard(), posts, false);
        const userTablePrefix = 'User__';
        const usersToSelect = QueryFilterService.getPrefixedAttributes(UsersModelProvider.getUserFieldsForPreview(), users, true, userTablePrefix);
        toSelect = Array.prototype.concat(toSelect, usersToSelect);
        const data = await knex(TABLE_NAME)
            .select(toSelect)
            // eslint-disable-next-line func-names
            .innerJoin(posts, function () {
            // @ts-ignore
            this.on(`${posts}.id`, '=', `${TABLE_NAME}.entity_id`)
                .andOn(knex.raw(`${TABLE_NAME}.entity_name = '${entityName}'`))
                .andOn(knex.raw(`${TABLE_NAME}.organization_id = ${orgId}`))
                .andOn(knex.raw(`${TABLE_NAME}.relation_type = ${relationType}`));
        })
            .innerJoin(postsStats, `${posts}.id`, `${postsStats}.post_id`)
            .innerJoin(users, `${users}.id`, `${posts}.user_id`)
            .orderByRaw(`${TABLE_NAME}.id ASC`);
        RepositoryHelper.hydrateObjectForManyEntities(data, userTablePrefix);
        return data;
    }
    static async countDiscussions(orgId) {
        const entityName = PostsModelProvider.getEntityName();
        const relationType = OrganizationsToEntitiesRelations.discussions();
        const query = knex(TABLE_NAME)
            .count(`${TABLE_NAME}.id AS amount`)
            .where({
            organization_id: orgId,
            entity_name: entityName,
            relation_type: relationType,
        });
        const res = await query;
        return +res[0].amount;
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
