import { AirdropsUsersGithubRawItem } from '../interfaces/model-interfaces';

import knex = require('../../../config/knex');
import RepositoryHelper = require('../../common/repository/repository-helper');

const TABLE_NAME = 'airdrops_users_github_raw';

class AirdropsUsersGithubRawRepository {
  public static async getScoreAndAmountByGithubId(
    githubId: number,
  ): Promise<AirdropsUsersGithubRawItem | null> {
    const data = await knex(TABLE_NAME)
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
