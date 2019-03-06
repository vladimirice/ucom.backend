import { Transaction } from 'knex';

import PostsModelProvider = require('../../../posts/service/posts-model-provider');
import knex = require('../../../../config/knex');
import QueryFilterService = require('../../../api/filters/query-filter-service');
import UsersModelProvider = require('../../../users/users-model-provider');
import RepositoryHelper = require('../../../common/repository/repository-helper');
import OrganizationsToEntitiesRelations = require('../../dictionary/organizations-to-entities-relations');

const TABLE_NAME = 'organizations_to_entities';

interface Relations {
  organization_id:  number;
  entity_name:      string;
  entity_id:        number;
  relation_type:    number;
}

const entityName    = PostsModelProvider.getEntityName();
const relationType  = OrganizationsToEntitiesRelations.discussions();
const posts         = PostsModelProvider.getTableName();
const postsStats    = PostsModelProvider.getPostsStatsTableName();
const users         = UsersModelProvider.getTableName();

class OrganizationsDiscussionsRepository {
  public static async findManyDiscussions(orgId: number) {
    let toSelect = QueryFilterService.getPrefixedAttributes(
      PostsModelProvider.getPostsFieldsForCard(),
      posts,
      false,
    );

    // #task - use knex hydrator or ORM or separate libs
    const userTablePrefix = 'User__';

    const usersToSelect = QueryFilterService.getPrefixedAttributes(
      UsersModelProvider.getUserFieldsForPreview(),
      users,
      true,
      userTablePrefix,
    );

    toSelect = Array.prototype.concat(toSelect, usersToSelect);

    const data = await knex(TABLE_NAME)
      .select(toSelect)
      // eslint-disable-next-line func-names
      .innerJoin(posts, function () {
        // @ts-ignore
        this.on(`${posts}.id`, '=', `${TABLE_NAME}.entity_id`)
          .andOn(knex.raw(`${TABLE_NAME}.entity_name = '${entityName}'`))
          .andOn(knex.raw(`${TABLE_NAME}.organization_id = ${orgId}`))
          .andOn(knex.raw(`${TABLE_NAME}.relation_type = ${relationType}`))
        ;
      })
      .innerJoin(postsStats, `${posts}.id`, `${postsStats}.post_id`)
      .innerJoin(users, `${users}.id`, `${posts}.user_id`)
      .orderByRaw(`${TABLE_NAME}.id ASC`);

    RepositoryHelper.hydrateObjectForManyEntities(data, userTablePrefix);

    return data;
  }

  public static async countDiscussions(
    orgId: number,
  ): Promise<number> {
    const query = knex(TABLE_NAME)
      .count(`${TABLE_NAME}.id AS amount`)
      .where({
        organization_id:  orgId,
        entity_name:      entityName,
        relation_type:    relationType,
      })
    ;

    const res = await query;

    return +res[0].amount;
  }

  public static async deleteAllDiscussions(orgId: number) {
    await knex(TABLE_NAME)
      .where({
        organization_id:  orgId,
        entity_name:      entityName,
        relation_type:    relationType,
      })
      .delete();
  }

  public static async updateDiscussionsState(
    orgId: number,
    postsIds: number[],
    trx: Transaction,
  ): Promise<void> {
    await trx(TABLE_NAME)
      .where({
        organization_id:  orgId,
        entity_name:      entityName,
        relation_type:    relationType,
      })
      .delete();

    const toInsert: Relations[] = [];

    for (const id of postsIds) {
      toInsert.push({
        organization_id:  orgId,
        entity_name:      entityName,
        relation_type:    relationType,
        entity_id:        id,
      });
    }

    await trx(TABLE_NAME).insert(toInsert);
  }
}

export = OrganizationsDiscussionsRepository;
