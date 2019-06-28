import { ApiLogger } from '../../../config/winston';

import UsersModelProvider = require('../users-model-provider');
import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

const TABLE_NAME = UsersModelProvider.getCurrentParamsTableName();
const foreignKeyField = UsersModelProvider.getForeignKeyField();

class UsersCurrentParamsRepository {
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

  public static async insertRowForNewEntity(entityId: number): Promise<void> {
    const data = {
      [foreignKeyField]: entityId,
    };

    await knex(TABLE_NAME).insert(data);
  }

  public static getNumericalFields(): string[] {
    return [
      'id',
      foreignKeyField,
      'scaled_importance_delta',
      'scaled_social_rate_delta',
      'posts_total_amount_delta',
    ];
  }
}

export = UsersCurrentParamsRepository;
