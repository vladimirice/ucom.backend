import { Transaction } from 'knex';
import _ from 'lodash';
import { UsersActivityIndexModelDto } from '../../interfaces/users-activity/model-interfaces';

import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../users-model-provider');
import OrganizationsModelProvider = require('../../../organizations/service/organizations-model-provider');

const TABLE_NAME = UsersModelProvider.getUsersActivityFollowTableName();
const orgsEntityName = OrganizationsModelProvider.getEntityName();
const usersEntityName = UsersModelProvider.getEntityName();

class UsersActivityFollowRepository {
  public static async insertOneFollowsOrganization(
    userIdFrom: number,
    orgIdTo: number,
    trx: Transaction,
  ): Promise<void> {
    await trx(TABLE_NAME).insert({
      user_id: userIdFrom,
      entity_id: orgIdTo,
      entity_name: orgsEntityName,
    });
  }

  public static async deleteOneFollowsOrg(
    userIdFrom: number,
    orgIdTo: number,
    trx: Transaction,
  ): Promise<number | null> {
    const res = await trx(TABLE_NAME)
      .where({
        user_id:      userIdFrom,
        entity_id:    orgIdTo,
        entity_name:  orgsEntityName,
      })
      .delete('id');

    return _.isEmpty(res) ? null : +res[0].id;
  }

  public static async doesUserFollowOrg(
    userIdFrom: number,
    orgIdTo: number,
  ): Promise<boolean> {
    const data = await this.getUserFollowsOrg(userIdFrom, orgIdTo);

    return data !== null;
  }

  public static async getUserFollowsOrg(
    userIdFrom: number,
    orgIdTo: number,
  ): Promise<UsersActivityIndexModelDto | null> {
    const res = await knex(TABLE_NAME)
      .where({
        user_id: userIdFrom,
        entity_id: orgIdTo,
        entity_name: orgsEntityName,
      })
      .first();

    return res || null;
  }

  public static async insertOneFollowsOtherUser(
    userIdFrom: number,
    userIdTo: number,
    trx: Transaction,
  ): Promise<void> {
    await trx(TABLE_NAME).insert({
      user_id: userIdFrom,
      entity_id: userIdTo,
      entity_name: usersEntityName,
    });
  }


  public static async deleteOneFollowsOtherUser(
    userIdFrom: number,
    userIdTo: number,
    trx: Transaction,
  ): Promise<number | null> {
    const res = await trx(TABLE_NAME)
      .where({
        user_id:      userIdFrom,
        entity_id:    userIdTo,
        entity_name:  usersEntityName,
      })
      .delete('id');

    return _.isEmpty(res) ? null : +res[0].id;
  }


  public static async doesUserFollowOtherUser(
    userIdFrom: number,
    userIdTo: number,
  ): Promise<boolean> {
    const data = await this.getUserFollowsOtherUser(userIdFrom, userIdTo);

    return data !== null;
  }


  public static async getUserFollowsOtherUser(
    userIdFrom: number,
    userIdTo: number,
  ): Promise<UsersActivityIndexModelDto | null> {
    const res = await knex(TABLE_NAME)
      .where({
        user_id: userIdFrom,
        entity_id: userIdTo,
        entity_name: usersEntityName,
      })
      .first();

    return res || null;
  }
}

export = UsersActivityFollowRepository;
