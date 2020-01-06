import { QueryBuilder } from 'knex';
import { InputQueryDto, QueryFilteredRepository } from '../../../api/filters/interfaces/query-filter-interfaces';

import RepositoryHelper = require('../../repository/repository-helper');

class KnexQueryBuilderHelper {
  public static async countByQueryBuilder(
    query: InputQueryDto,
    repository: QueryFilteredRepository,
    knex: QueryBuilder,
  ): Promise<number> {
    this.addCountParamsToKnex(query, repository, knex);

    const data = await knex;

    return RepositoryHelper.getKnexCountAsNumber(data);
  }

  public static async addCountToQueryBuilderAndCalculate(
    queryBuilder: QueryBuilder,
    countPrefix: string | null = null,
  ): Promise<number> {
    const field = countPrefix ? `${countPrefix}.id` : 'id';

    queryBuilder.count(`${field} as amount`);
    const data = await queryBuilder;

    return RepositoryHelper.getKnexCountAsNumber(data);
  }

  public static async getListByQueryBuilder(
    repository: QueryFilteredRepository,
    knex,
  ): Promise<any> {
    const data = await knex;

    RepositoryHelper.convertStringFieldsToNumbersForArray(
      data,
      repository.getNumericalFields(),
      repository.getFieldsToDisallowZero(),
    );

    return data;
  }

  private static addCountParamsToKnex(
    query: InputQueryDto,
    repository: QueryFilteredRepository,
    knex: QueryBuilder,
  ): void {
    repository.addWhere(query, knex);

    knex.count('id as amount');
  }
}

export = KnexQueryBuilderHelper;
