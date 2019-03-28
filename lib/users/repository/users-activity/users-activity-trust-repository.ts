import { Transaction } from 'knex';
import { UsersActivityTrustModelDto } from '../../interfaces/users-activity/model-interfaces';

import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../users-model-provider');
import _ from 'lodash';

const TABLE_NAME = UsersModelProvider.getUsersActivityTrustTableName();

class UsersActivityTrustRepository {
  public static async insertOneTrustUser(
    userIdFrom: number,
    userIdTo: number,
    trx: Transaction,
  ): Promise<void> {
    const entityName = UsersModelProvider.getEntityName();

    await trx(TABLE_NAME).insert({
      user_id: userIdFrom,
      entity_id: userIdTo,
      entity_name: entityName,
    });
  }

  public static async deleteOneTrustUser(
    userIdFrom: number,
    userIdTo: number,
    trx: Transaction,
  ): Promise<number | null> {
    const entityName = UsersModelProvider.getEntityName();

    const res = await trx(TABLE_NAME)
      .where({
        user_id:      userIdFrom,
        entity_id:    userIdTo,
        entity_name:  entityName,
      })
      .delete('id');

    return _.isEmpty(res) ? null : +res[0].id;
  }

  public static async getUserTrustUser(
    userIdFrom: number,
    userIdTo: number,
  ): Promise<UsersActivityTrustModelDto | null> {
    const res = await knex(TABLE_NAME)
      .where({
        user_id: userIdFrom,
        entity_id: userIdTo,
        entity_name: UsersModelProvider.getEntityName(),
      })
      .first();

    return res || null;
  }
}

export = UsersActivityTrustRepository;
