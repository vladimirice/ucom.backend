import UosAccountsModelProvider = require('../service/uos-accounts-model-provider');
import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

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
}

export = UosAccountsPropertiesRepository;
