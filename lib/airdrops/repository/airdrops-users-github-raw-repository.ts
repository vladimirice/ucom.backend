import { AirdropsUsersGithubRawItem } from '../interfaces/model-interfaces';
import { AppError } from '../../api/errors';

import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');
import AirdropsModelProvider = require('../service/airdrops-model-provider');

const ROUND_ONE_TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawTableName();
const ROUND_TWO_TABLE_NAME = AirdropsModelProvider.airdropsUsersGithubRawRoundTwoTableName();

const SOURCE_TABLE_NAMES = [
  ROUND_ONE_TABLE_NAME,
  ROUND_TWO_TABLE_NAME,
];

class AirdropsUsersGithubRawRepository {
  public static async getScoreAndAmountByGithubId(
    githubId: number,
    sourceTableName: string,
  ): Promise<AirdropsUsersGithubRawItem | null> {
    if (!SOURCE_TABLE_NAMES.includes(sourceTableName)) {
      throw new AppError(`Unsupported source table name: ${sourceTableName}`);
    }

    const data = await knex(sourceTableName)
      .select(['id', 'score', 'amount'])
      .where('id', '=', githubId)
    ;

    RepositoryHelper.convertStringFieldsToNumbersForArray(
      data,
      this.getNumericalFields(),
      this.getFieldsToDisallowZero(),
    );

    return data.length > 0 ? data[0] : null;
  }

  private static getNumericalFields(): string[] {
    return [
      'id',
      'score',
      'amount',
    ];
  }

  private static getFieldsToDisallowZero(): string[] {
    return [
      'id',
    ];
  }
}

export = AirdropsUsersGithubRawRepository;
