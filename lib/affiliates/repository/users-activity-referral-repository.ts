import { Transaction } from 'knex';
import { ConversionToProcessDto } from '../interfaces/dto-interfaces';

import UsersModelProvider = require('../../users/users-model-provider');
import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

const TABLE_NAME = UsersModelProvider.getUsersActivityReferralTableName();

class UsersActivityReferralRepository {
  public static async insertOneUserReferral(
    conversionDto: ConversionToProcessDto,
    transaction: Transaction,
  ): Promise<void> {
    const entityName = UsersModelProvider.getEntityName();

    await transaction(TABLE_NAME).insert({
      referral_user_id: conversionDto.referral_user_id,
      source_entity_id: conversionDto.source_user_id,
      conversion_id:    conversionDto.conversion_id,
      entity_name:      entityName,
    });
  }

  public static async doesUserReferralExist(
    referralUserId: number,
    sourceUserId: number,
  ): Promise<boolean> {
    const queryBuilder = knex(TABLE_NAME)
      .where({
        referral_user_id: referralUserId,
        source_entity_id: sourceUserId,
        entity_name:      UsersModelProvider.getEntityName(),
      });

    return RepositoryHelper.doesExistByQueryBuilder(queryBuilder);
  }

  public static async countReferralsOfUser(userId: number): Promise<number> {
    const res = await knex(TABLE_NAME)
      .count(`${TABLE_NAME}.id AS amount`)
      .where({
        source_entity_id: userId,
        entity_name:      UsersModelProvider.getEntityName(),
      });

    return RepositoryHelper.getKnexCountAsNumber(res);
  }
}

export = UsersActivityReferralRepository;
