import { Transaction } from 'knex';
import { ApiLogger } from '../../../config/winston';

import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

const TABLE_NAME = 'tags_current_params';

const foreignKeyField = 'tag_id';

class TagsCurrentParamsRepository {
  public static async getCurrentStatsByEntityId(
    entityId: number,
  ) {
    const data = await knex(TABLE_NAME).where(foreignKeyField, entityId).first();

    if (!data) {
      ApiLogger.error(`There is no stats record for ${foreignKeyField} = ${entityId} but must be`);

      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());

    return data;
  }

  public static async insertManyRowsForNewEntity(
    entitiesIds: number[],
    trx: Transaction,
  ): Promise<void> {
    const data = entitiesIds.map(entityId => ({
      [foreignKeyField]: entityId,
    }));

    await trx(TABLE_NAME).insert(data);
  }

  public static getNumericalFields(): string[] {
    return [
      'id',
      foreignKeyField,
      'importance_delta',
      'activity_index_delta',
      'posts_total_amount_delta',
    ];
  }
}

export = TagsCurrentParamsRepository;
