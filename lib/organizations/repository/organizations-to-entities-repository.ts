import { Transaction } from 'knex';

import PostsModelProvider = require('../../posts/service/posts-model-provider');
import OrganizationsToEntitiesRelations = require('../dictionary/OrganizationsToEntitiesRelations');
import knex = require('../../../config/knex');
import QueryFilterService = require('../../api/filters/query-filter-service');
import UsersModelProvider = require('../../users/users-model-provider');

const TABLE_NAME = 'organizations_to_entities';

interface Relations {
  organization_id:  number;
  entity_name:      string;
  entity_id:        number;
  relation_type:    number;
}

class OrganizationsToEntitiesRepository {
  public static async findManyDiscussions(orgId: number) {
    const entityName    = PostsModelProvider.getEntityName();
    const relationType  = OrganizationsToEntitiesRelations.discussions();
    const posts         = PostsModelProvider.getTableName();
    const postsStats    = PostsModelProvider.getPostsStatsTableName();
    const users         = UsersModelProvider.getTableName();

    let toSelect = QueryFilterService.getPrefixedAttributes(
      PostsModelProvider.getPostsFieldsForCard(),
      posts,
      false,
    );

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

    this.hydrateManyObjects(data, userTablePrefix);

    return data;
  }

  private static hydrateManyObjects(data: any, objectPrefix: string, delimiter = '__') {
    data.forEach((item) => {
      this.hydrateOneObject(item, objectPrefix, delimiter);
    });
  }

  private static hydrateOneObject(data: any, objectPrefix: string, delimiter = '__') {
    const obj: any = {};

    const fieldsToDelete: string[] = [];
    for (const field in data) {
      if (!data.hasOwnProperty(field)) {
        continue;
      }

      if (field.includes(objectPrefix)) {
        const objField = field.replace(objectPrefix, '');
        obj[objField] = data[field];

        fieldsToDelete.push(field);
      }
    }

    fieldsToDelete.forEach((field) => {
      delete data[field];
    });

    const objectKey = objectPrefix.replace(delimiter, '');
    data[objectKey] = obj;
  }

  public static async updateDiscussionsState(
    orgId: number,
    postsIds: number[],
    trx: Transaction,
  ): Promise<void> {
    const entityName    = PostsModelProvider.getEntityName();
    const relationType  = OrganizationsToEntitiesRelations.discussions();

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

export = OrganizationsToEntitiesRepository;
