import { StringToAnyCollection } from '../../../common/interfaces/common-types';

import UsersModelProvider = require('../../users-model-provider');
import knex = require('../../../../config/knex');
import KnexQueryBuilderHelper = require('../../../common/helper/repository/knex-query-builder-helper');

const USERS_ACTIVITY_EVENTS_VIEW = UsersModelProvider.getUsersActivityEventsViewTableName();

class UsersActivityEventsViewRepository {
  public static async getViewsCountForEntity(entity_id: number, entity_name: string): Promise<number> {
    const queryBuilder = knex(USERS_ACTIVITY_EVENTS_VIEW)
      .where({
        entity_id,
        entity_name,
      });

    return KnexQueryBuilderHelper.addCountToQueryBuilderAndCalculate(queryBuilder);
  }

  public static async insertOneView(
    user_id: number | null,
    entity_id: number,
    entity_name: string,
    json_headers: StringToAnyCollection,
  ) {
    const data = {
      user_id,
      entity_id,
      entity_name,
      json_headers,
    };

    await knex(USERS_ACTIVITY_EVENTS_VIEW).insert(data);
  }
}

export = UsersActivityEventsViewRepository;
