import { Transaction } from 'knex';

import { ApiLogger } from '../../../config/winston';

import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

const TABLE_NAME = 'posts_current_params';

class PostsCurrentParamsRepository {
  public static async getCurrentStatsByEntityId(
    postId: number,
  ) {
    const data = await knex(TABLE_NAME).where('post_id', postId).first();

    if (!data) {
      ApiLogger.error(`There is no stats record for post with ID ${postId} but must be`);

      return null;
    }

    RepositoryHelper.convertStringFieldsToNumbers(data, this.getNumericalFields());

    return data;
  }

  public static async insertRowForNewEntity(postId: number): Promise<void> {
    const data = {
      post_id: postId,
    };

    await knex(TABLE_NAME).insert(data);
  }

  public static async insertRowForNewEntityWithTransaction(postId: number, transaction: Transaction): Promise<void> {
    const data = {
      post_id: postId,
    };

    await transaction(TABLE_NAME).insert(data);
  }

  public static async updateValuesForEntity(entityId: number, values: any) {
    return knex(TABLE_NAME)
      .where('post_id', '=', +entityId)
      .update(values);
  }

  private static getNumericalFields(): string[] {
    return [
      'id',
      'post_id',
      'importance_delta',
      'activity_index_delta',
      'upvotes_delta',
    ];
  }
}

export = PostsCurrentParamsRepository;
