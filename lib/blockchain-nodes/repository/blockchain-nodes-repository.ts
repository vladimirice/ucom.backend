import { QueryBuilder } from 'knex';
import { StringToAnyCollection } from '../../common/interfaces/common-types';
import { QueryFilteredRepository } from '../../api/filters/interfaces/query-filter-interfaces';
import { RequestQueryBlockchainNodes } from '../interfaces/blockchain-nodes-interfaces';

import knex = require('../../../config/knex');
import InsertUpdateRepositoryHelper = require('../../common/helper/repository/insert-update-repository-helper');
import RepositoryHelper = require('../../common/repository/repository-helper');
import BlockchainModelProvider = require('../../eos/service/blockchain-model-provider');

const _ = require('lodash');

const model       = BlockchainModelProvider.getModel();

const TABLE_NAME  = BlockchainModelProvider.getTableName();

const db = require('../../../models').sequelize;

const { Op } = db.Sequelize;

// @ts-ignore - static fields are not allowed to be inside interface. Waiting for typescript updating.
class BlockchainNodesRepository implements QueryFilteredRepository {
  public static getQueryBuilder(): QueryBuilder {
    return knex(TABLE_NAME);
  }

  public static async findBlockchainNodeIdsByAccountNames(
    accountNames: string[],
  ): Promise<any> {
    const data = await knex(TABLE_NAME)
      .select(['id', 'title'])
      .whereIn('title', accountNames);

    const indexed = {};
    data.forEach((item) => {
      indexed[item.title] = item.id;
    });

    return indexed;
  }

  public static async findBlockchainNodeIdsByObjectIndexedByTitle(
    indexedObject: StringToAnyCollection,
  ): Promise<any> {
    return this.findBlockchainNodeIdsByAccountNames(Object.keys(indexedObject));
  }

  /**
   *
   * @param {string[]} existedTitles
   * @return {Promise<*>}
   */
  static async setDeletedAtNotExisted(existedTitles) {
    const prepared = existedTitles.map(item => `'${item}'`);

    const sql = `
      UPDATE ${TABLE_NAME}
      SET deleted_at = NOW(),
          title = title || '_deleted_' || NOW()
      WHERE
        title NOT IN (${prepared.join(', ')})
        AND deleted_at IS NULL
    `;

    return db.query(sql);
  }

  public static async createOrUpdateNodes(indexedData: any, blockchainNodesType: number) {
    for (const key in indexedData) {
      if (!indexedData.hasOwnProperty(key)) {
        continue;
      }

      indexedData[key].blockchain_nodes_type = blockchainNodesType;
    }

    const insertSqlPart: string = InsertUpdateRepositoryHelper.getInsertManyRawSqlFromIndexed(indexedData, TABLE_NAME);

    const sql = `
    ${insertSqlPart}
    ON CONFLICT (title) DO
    UPDATE
        SET votes_count                 = EXCLUDED.votes_count,
            votes_amount                = EXCLUDED.votes_amount,
            scaled_importance_amount    = EXCLUDED.scaled_importance_amount,
            currency                    = EXCLUDED.currency,
            bp_status                   = EXCLUDED.bp_status
    `;

    await knex.raw(sql);
  }

  /**
   * @param {Object} queryParameters
   *
   * @return {Promise<Object>}
   */
  static async findAllBlockchainNodesLegacy(queryParameters = {}) {
    const params = _.defaults(queryParameters, this.getDefaultListParams());

    params.limit = 1000;

    if (!params.where) {
      params.where = {};
    }

    params.where.deleted_at = {
      [Op.eq]: null,
    };

    params.where.bp_status = {
      [Op.in]: [1, 2],
    };

    const data = await model.findAll({
      attributes: this.getFieldsForPreview(),
      ...params,
    });

    RepositoryHelper.convertStringFieldsToNumbersForArray(data, this.getNumericalFields());

    return data;
  }

  public static getDefaultListParams() {
    return {
      attributes: this.getFieldsForPreview(),
      where: {},
      order: this.getDefaultOrderBy(),
      limit: 10,
      offset: 0,
      raw: true,
    };
  }

  public  static getFieldsForPreview() {
    return [
      'id',
      'title',
      'votes_count',
      'votes_amount',

      'currency',
      'bp_status',
      'blockchain_nodes_type',
      'scaled_importance_amount',
    ];
  }

  private static getDefaultOrderBy() {
    return [
      ['bp_status', 'ASC'],
      ['title', 'ASC'],
    ];
  }

  private static getNumericalFields(): string[] {
    return [
      'id',
      'votes_amount',
      'scaled_importance_amount',
    ];
  }

  public static getFieldsToDisallowZero(): string[] {
    return [
      'id',
    ];
  }

  public static getAllowedOrderBy() {
    return [
      'id', 'title', 'votes_count', 'votes_amount', 'bp_status',
    ];
  }

  // noinspection JSUnusedGlobalSymbols
  public static getOrderByRelationMap() {
    return {};
  }

  public static addWhere(query: RequestQueryBlockchainNodes, queryBuilder: QueryBuilder) {
    if (!query.filters) {
      return;
    }

    if (query.filters.title_like) {
      queryBuilder.andWhere('title', 'ilike', `%${query.filters.title_like}%`);
    }

    if (query.filters.blockchain_nodes_type) {
      queryBuilder.andWhere('blockchain_nodes_type', '=', +query.filters.blockchain_nodes_type);
    }

    if (!query.filters.deleted_at) {
      queryBuilder.whereNull('deleted_at');
    }
  }

  public static getWhereProcessor(): Function {
    // @ts-ignore
    return (query, params) => {};
  }
}

export = BlockchainNodesRepository;
