import { DbParamsDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { PostRequestQueryDto } from '../../posts/interfaces/model-interfaces';
import { StringToAnyCollection } from '../interfaces/common-types';

import knex = require('../../../config/knex');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import KnexQueryBuilderHelper = require('../helper/repository/knex-query-builder-helper');
import OrganizationsModelProvider = require('../../organizations/service/organizations-model-provider');
import UsersModelProvider = require('../../users/users-model-provider');

const _ = require('lodash');

const sequelizeIncludes = require('./sequelize-includes');

const models = require('../../../models');

const { Op } = models.Sequelize;
const db = models.sequelize;

/**
 * repository name is wrong. This repo used to fetch also tags wall feed data
 */
class UsersFeedRepository {
  /**
   *
   * @param {string} tagTitle
   * @param {Object} givenParams
   * @returns {Promise<Object[]>}
   */
  static async findAllPostsForWallFeedByTag(tagTitle, givenParams) {
    givenParams.where = this.whereEntityTagsContain([tagTitle]);

    return this.findAllForWallFeed(givenParams);
  }

  /**
   *
   * @param {string} tagTitle
   * @returns {Promise<number>}
   */
  static async countAllPostsForWallFeedByTag(tagTitle) {
    return PostsModelProvider.getModel().count({
      where: this.whereEntityTagsContain([tagTitle]),
    });
  }

  /**
   *
   * @param {string[]} tagTitles
   * @returns {{entity_tags: {}}}
   * @private
   */
  private static whereEntityTagsContain(tagTitles) {
    return {
      entity_tags: {
        [Op.contains]: db.cast(tagTitles, 'text[]'),
      },
    };
  }

  public static async findAllForUserWallFeed(
    userId: number,
    givenParams = {},
    requestQuery: PostRequestQueryDto | null = null,
  ) {
    const params: DbParamsDto = _.defaults(givenParams, this.getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();

    params.where = {
      entity_name_for:  UsersModelProvider.getEntityName(),
      entity_id_for:    userId,
    };

    this.addExcludePostTypeIdsToSequelizeWhere(requestQuery, params);

    const data = await PostsModelProvider.getModel().findAll(params);

    return data.map((model) => model.toJSON());
  }

  static getIncludeProcessor() {
    // @ts-ignore
    return (query, params) => {
      params.include = sequelizeIncludes.getIncludeForPostList();
    };
  }

  public static async findAllForUserNewsFeed(
    userId: number,
    usersIds: number[],
    orgIds: number[],
    givenParams: StringToAnyCollection,
    requestQuery: PostRequestQueryDto,
  ) {
    const params = _.defaults(givenParams, this.getDefaultListParams());

    // #task - move to default params
    params.attributes = PostsModelProvider.getPostsFieldsForPreview();

    params.where = {
      [Op.or]: [
        {
          entity_id_for:   Array.prototype.concat(usersIds, userId),
          entity_name_for: UsersModelProvider.getEntityName(),
        },
        {
          entity_id_for:    orgIds,
          entity_name_for:  OrganizationsModelProvider.getEntityName(),
        },
      ],
    };

    this.addExcludePostTypeIdsToSequelizeWhere(requestQuery, params);

    const data = await PostsModelProvider.getModel().findAll(params);

    return data.map((model) => model.toJSON());
  }

  private static addExcludePostTypeIdsToSequelizeWhere(
    requestQuery: PostRequestQueryDto | null,
    params: StringToAnyCollection,
  ): void {
    if (requestQuery && requestQuery.exclude_post_type_ids) {
      params.where.post_type_id = {
        [Op.notIn]: requestQuery.exclude_post_type_ids,
      };
    }
  }

  public static async countAllForUserNewsFeed(
    userId: number,
    usersIds: number[],
    orgIds: number[],
    requestQuery: PostRequestQueryDto,
  ) {
    const params = {
      where: {
        [Op.or]: [
          {
            entity_id_for:   Array.prototype.concat(usersIds, userId),
            entity_name_for: UsersModelProvider.getEntityName(),
          },
          {
            entity_id_for:    orgIds,
            entity_name_for:  OrganizationsModelProvider.getEntityName(),
          },
        ],
      },
    };

    this.addExcludePostTypeIdsToSequelizeWhere(requestQuery, params);

    return PostsModelProvider.getModel().count(params);
  }

  public static async countAllForOrgWallFeed(entityId: number): Promise<number> {
    return this.countAllForWallFeed(entityId, OrganizationsModelProvider.getEntityName());
  }

  public static async countAllForUserWallFeed(
    wallOwnerId: number,
    postsQuery: PostRequestQueryDto | null = null,
  ): Promise<number> {
    return this.countAllForWallFeed(wallOwnerId, UsersModelProvider.getEntityName(), postsQuery);
  }

  /**
   *
   * @param {number} entityId
   * @param {Object} givenParams
   * @return {Promise<any[]>}
   */
  static async findAllForOrgWallFeed(entityId, givenParams = {}) {
    const params = _.defaults(givenParams, this.getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();

    params.where = {
      entity_name_for:  OrganizationsModelProvider.getEntityName(),
      entity_id_for:    entityId,
    };

    const data = await PostsModelProvider.getModel().findAll(params);

    return data.map((model) => model.toJSON());
  }

  /**
   *
   * @param {Object} givenParams
   * @returns {Promise<Object[]>}
   * @private
   */
  private static async findAllForWallFeed(givenParams) {
    const params = _.defaults(givenParams, this.getDefaultListParams());

    params.attributes = PostsModelProvider.getPostsFieldsForPreview();
    params.include = sequelizeIncludes.getIncludeForPostList();

    const data = await PostsModelProvider.getModel().findAll(params);

    return data.map((model) => model.toJSON());
  }

  private static async countAllForWallFeed(
    entityIdFor: number,
    entityNameFor: string,
    requestQuery: PostRequestQueryDto | null = null,
  ) {
    const queryBuilder = knex(PostsModelProvider.getTableName())
      .where({
        entity_name_for: entityNameFor,
        entity_id_for: entityIdFor,
      });

    if (requestQuery && requestQuery.exclude_post_type_ids) {
      queryBuilder.whereNotIn('post_type_id', requestQuery.exclude_post_type_ids);
    }

    return KnexQueryBuilderHelper.addCountToQueryBuilderAndCalculate(queryBuilder);
  }

  public static getDefaultListParams() {
    return {
      offset: 0,
      limit: 10,
      where: {},
      order: this.getDefaultOrderBy(),
    };
  }

  /**
   *
   * @return {string[][]}
   * @private
   */
  private static getDefaultOrderBy() {
    return [
      ['id', 'DESC'],
    ];
  }
}

export = UsersFeedRepository;
