import UosAccountsModelProvider = require('../service/uos-accounts-model-provider');
import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');
import UsersModelProvider = require('../../users/users-model-provider');

const TABLE_NAME = UosAccountsModelProvider.uosAccountsPropertiesTableName();

const fieldsToNumerical: string[] = [
  'id',
  'entity_id',

  'staked_balance',
  'validity',

  'importance',
  'scaled_importance',

  'stake_rate',
  'scaled_stake_rate',

  'social_rate',
  'scaled_social_rate',

  'transfer_rate',
  'scaled_transfer_rate',

  'previous_cumulative_emission',
  'current_emission',
  'current_cumulative_emission',
];

class UosAccountsPropertiesRepository {
  public static async findAll(): Promise<any[]> {
    const data: any[] = await knex(TABLE_NAME);

    RepositoryHelper.convertStringFieldsToNumbersForArray(data, fieldsToNumerical, ['id', 'entity_id']);

    return data;
  }

  public static async findManyForEntityEvents(
    limit: number,
    lastId: number | null = null,
  ): Promise<any> {
    const queryBuilder = knex(TABLE_NAME)
      .where({
        entity_name: UsersModelProvider.getEntityName(),
      })
      .orderBy('id', 'ASC')
      .limit(limit)
    ;

    if (lastId) {
      // noinspection JSIgnoredPromiseFromCall
      queryBuilder.whereRaw(`id > ${+lastId}`);
    }

    const data = await queryBuilder;

    RepositoryHelper.convertStringFieldsToNumbersForArray(data, fieldsToNumerical, ['id', 'entity_id']);

    return data;
  }
}

export = UosAccountsPropertiesRepository;
