import { PostWithTagCurrentRateDto } from '../tags/interfaces/dto-interfaces';
import { ModelWithEventParamsDto } from '../stats/interfaces/dto-interfaces';
import { QueryFilteredRepository } from '../api/filters/interfaces/query-filter-interfaces';
import { PostRequestQueryDto } from './interfaces/model-interfaces';

import OrganizationsModelProvider = require('../organizations/service/organizations-model-provider');
import RepositoryHelper = require('../common/repository/repository-helper');
import PostsModelProvider = require('./service/posts-model-provider');
import EntityListCategoryDictionary = require('../stats/dictionary/entity-list-category-dictionary');

const { ContentTypeDictionary } = require('ucom-libs-social-transactions');
const _ = require('lodash');

const models = require('../../models');

const ENTITY_STATS_CURRENT_TABLE_NAME = 'entity_stats_current';

const entityStatsCurrentModel = models[ENTITY_STATS_CURRENT_TABLE_NAME];

const db = models.sequelize;
const { Op } = db;

const orgModelProvider    = require('../organizations/service/organizations-model-provider');
const postsModelProvider  = require('./service/posts-model-provider');
const usersModelProvider  = require('../users/users-model-provider');

const POST_TYPE__MEDIA_POST = ContentTypeDictionary.getTypeMediaPost();
const userPreviewAttributes = usersModelProvider.getUserFieldsForPreview();

const postStatsRepository = require('./stats/post-stats-repository');
const commentsRepository  = require('../comments/comments-repository');

const TABLE_NAME = 'posts';

const model = postsModelProvider.getModel();

const knex = require('../../config/knex');

// @ts-ignore
class PostsRepository implements QueryFilteredRepository {
  public static async getManyOrgsPostsAmount() {
    const orgEntityName: string = OrganizationsModelProvider.getEntityName();

    const postTypes: number[] = [
      ContentTypeDictionary.getTypeMediaPost(),
      ContentTypeDictionary.getTypeDirectPost(),
    ];

    const sql = `
      SELECT array_agg(post_type_id || '__' || amount) AS array_agg, entity_id_for FROM
        (
          SELECT entity_id_for, post_type_id, COUNT(1) AS amount
          FROM posts
          WHERE entity_name_for = '${orgEntityName}'
          AND post_type_id IN (${postTypes.join(', ')})
          GROUP BY entity_id_for, post_type_id
        ) AS t
      GROUP BY entity_id_for
    `;

    const data = await knex.raw(sql);

    return data.rows.map(row => ({
      aggregates: RepositoryHelper.splitAggregates(row),
      entityId: +row.entity_id_for,
    }));
  }

  public static async getManyPostsRepostsAmount() {
    const postTypeId: number = ContentTypeDictionary.getTypeRepost();

    const sql = `
       SELECT parent_id, blockchain_id, COUNT(1) AS amount FROM posts
       WHERE post_type_id = ${postTypeId}
       GROUP BY parent_id, blockchain_id
    `;

    const data = await knex.raw(sql);

    return data.rows.map(item => ({
      entityId:       item.parent_id,
      blockchainId:   item.blockchain_id,
      repostsAmount:  +item.amount,
    }));
  }

  public static async findManyPostsEntityEvents(
    limit: number,
    lastId: number | null = null,
  ): Promise<ModelWithEventParamsDto[]> {
    const queryBuilder = knex('posts')
      .select(['id', 'blockchain_id', 'current_rate'])
      .orderBy('id', 'ASC')
      .limit(limit)
    ;

    if (lastId) {
      // noinspection JSIgnoredPromiseFromCall
      queryBuilder.whereRaw(`id > ${+lastId}`);
    }

    return queryBuilder;
  }

  /**
   *
   * @param {number} id
   * @param {Object} entityTags
   * @param {Transaction} trx
   * @returns {Promise<void>}
   */
  static async updatePostEntityTagsById(id, entityTags, trx) {
    // noinspection JSCheckFunctionSignatures
    return trx(postsModelProvider.getTableName())
      .update({ entity_tags: entityTags })
      .where('id', '=', id)
      .returning('*')
    ;
  }

  /**
   *
   * @param {string[]} blockchainIds
   * @return {Promise<Object>}
   */
  static async findIdsByBlockchainIds(blockchainIds) {
    // noinspection TypeScriptValidateJSTypes
    const data =  await this.getModel().findAll({
      attributes: ['id', 'blockchain_id'],
      where: {
        blockchain_id: blockchainIds,
      },
      raw: true,
    });

    const res = {};
    data.forEach((item) => {
      res[item.blockchain_id] = item.id;
    });

    return res;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @returns {Function}
   */
  static getWhereProcessor() {
    return (query: PostRequestQueryDto, params) => {
      if (query.post_type_id) {
        params.where.post_type_id = +query.post_type_id;
      }

      if (query.overview_type && query.overview_type === EntityListCategoryDictionary.getTrending()) {
        Object.assign(params.where, this.whereSequelizeTranding());
      }

      if (query.overview_type && query.overview_type === EntityListCategoryDictionary.getHot()) {
        Object.assign(params.where, this.whereSequelizeHot());
      }
    };
  }

  public static whereSequelizeTranding() {
    const greaterThan = process.env.NODE_ENV === 'staging' ? -100 : 0;

    return {
      importance_delta: db.where(db.col(`${PostsModelProvider.getCurrentParamsTableName()}.importance_delta`), {
        [Op.gt]: greaterThan,
      }),
      upvotes_delta: db.where(db.col(`${PostsModelProvider.getCurrentParamsTableName()}.upvotes_delta`), {
        [Op.gt]: greaterThan,
      }),
    };
  }

  public static whereSequelizeHot() {
    const greaterThan = process.env.NODE_ENV === 'staging' ? -100 : 0;

    return {
      activity_index: db.where(db.col(`${PostsModelProvider.getCurrentParamsTableName()}.activity_index_delta`), {
        [Op.gt]: greaterThan,
      }),
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @returns {Object}
   */
  static getOrderByRelationMap() {
    return {
      comments_count: [
        postsModelProvider.getPostStatsModel(),
        'comments_count',
      ],
      importance_delta: [
        postsModelProvider.getCurrentParamsSequelizeModel(),
        'importance_delta',
      ],
      activity_index_delta: [
        postsModelProvider.getCurrentParamsSequelizeModel(),
        'activity_index_delta',
      ],
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @return {string[]}
   */
  static getAllowedOrderBy() {
    return [
      'current_rate',
      'id',
      'title',
      'comments_count',
      'current_vote',
      'created_at',

      'activity_index_delta',
      'importance_delta',
    ];
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} id
   * @return {Promise<boolean>}
   */
  static async isForOrganization(id) {
    const where = {
      id,
      organization_id: {
        [Op.ne]: null,
      },
    };

    const res = await model.count({
      where,
    });

    return !!res;
  }

  // noinspection JSUnusedGlobalSymbols
  static async incrementCurrentVoteCounter(id, by = 1) {
    // noinspection TypeScriptValidateJSTypes
    return this.getModel().increment('current_vote', {
      by,
      where: {
        id,
      },
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} id
   * @param {number} by
   * @returns {Promise<*>}
   */
  static async decrementCurrentVoteCounter(id, by = 1) {
    // noinspection TypeScriptValidateJSTypes
    return this.getModel().decrement('current_vote', {
      by,
      where: {
        id,
      },
    });
  }

  static async findLastByAuthor(userId, isRaw = true) {
    const data = await this.getModel().findOne({
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__MEDIA_POST,
      },
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
    });

    return isRaw ? data.toJSON() : data;
  }

  static async findFirstMediaPostIdUserId(userId: number): Promise<number|null> {
    const data = await this.getModel().findOne({
      attributes: ['id'],
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__MEDIA_POST,
      },
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
      raw: true,
    });

    return data ? data.id : null;
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<number|null>}
   */
  static async findLastMediaPostIdUserId(userId) {
    const data = await this.getModel().findOne({
      attributes: ['id'],
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__MEDIA_POST,
      },
      order: [
        ['id', 'ASC'],
      ],
      limit: 1,
      raw: true,
    });

    return data ? data.id : null;
  }

  // noinspection JSUnusedGlobalSymbols
  static async findLast(isRaw = true) {
    const data = await this.getModel().findOne({
      where: {
        post_type_id: POST_TYPE__MEDIA_POST,
      },
      order: [
        ['id', 'DESC'],
      ],
      limit: 1,
    });

    return isRaw ? data.toJSON() : data;
  }

  /**
   *
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findAllMediaPosts(raw = true) {
    // noinspection TypeScriptValidateJSTypes
    return this.getModel().findAll({
      raw,
      where: {
        post_type_id: POST_TYPE__MEDIA_POST,
      },
    });
  }

  /**
   *
   * @param {Object | null} queryParameters
   * @returns {Promise<number>}
   */
  static async countAllPosts(queryParameters: any | null = null) {
    const include = [
      PostsModelProvider.getCurrentParamsSequelizeInclude(),
      {
        attributes: [],
        model: entityStatsCurrentModel, // @deprecated
        required: false,
      },
    ];

    const where = queryParameters !== null ? queryParameters.where : {};

    return PostsRepository.getModel().count({
      where,
      include,
    });
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMinPostIdByParameter(field) {
    const order: any = [];

    order[0] = [field, 'ASC'];
    order[1] = ['id', 'DESC'];

    const result = await PostsRepository.getModel().findOne({
      order,
      attributes: [
        'id',
      ],
      limit: 1,
      raw: true,
    });

    return result ? result.id : null;
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMaxPostIdByParameter(field) {
    const order: any = [];

    order[0] = [field, 'DESC'];
    order[1] = ['id', 'DESC'];

    const result = await PostsRepository.getModel().findOne({
      order,
      attributes: [
        'id',
      ],
      limit: 1,
      raw: true,
    });

    return result ? result.id : null;
  }

  /**
   *
   * @param {Object|null} queryParameters
   * @return {Promise<any[]>}
   */
  static async findAllPosts(queryParameters = {}) {
    const params = _.defaults(queryParameters, this.getDefaultListParams());
    params.attributes = this.getModel().getFieldsForPreview();

    const data = await postsModelProvider.getModel().findAll(params);

    return data.map(item => item.toJSON());
  }

  // noinspection JSUnusedGlobalSymbols
  public static getIncludeProcessor(): Function {
    // @ts-ignore
    return (query, params) => {
      params.include = [
        orgModelProvider.getIncludeForPreview(),
        usersModelProvider.getIncludeAuthorForPreview(),
        postsModelProvider.getPostsStatsInclude(),
        postsModelProvider.getPostOfferItselfInclude(),
        postsModelProvider.getParentPostInclude(),
        postsModelProvider.getCurrentParamsSequelizeInclude(),
      ];
    };
  }

  // noinspection JSUnusedGlobalSymbols
  static async findOneForIpfs(id, postTypeId) {
    const postOfferAttributes = models.post_offer.getPostOfferAttributesForIpfs();

    const include = [
      {
        attributes: ['account_name'],
        model: models.Users,
      },
    ];

    if (postTypeId === ContentTypeDictionary.getTypeOffer()) {
      include.push({
        attributes: postOfferAttributes,
        model: models.post_offer,
      });
    }

    const postAttributes = this.getModel().getMediaPostAttributesForIpfs();

    return this.getModel().findOne({
      include,
      attributes: postAttributes,
      where: {
        id,
        post_type_id: postTypeId,
      },
      raw: true,
    });
  }

  /**
   *
   * @param {number} id
   * @return {Promise<*>}
   */
  static async findOneOnlyWithOrganization(id) {
    const res = await this.getModel().findOne({
      where: {
        id,
      },
      include: [
        orgModelProvider.getModel(),
      ],
    });

    return res ? res.toJSON() : null;
  }

  public static async findOneByIdV2(
    id: number,
    isRaw: boolean = false,
  ) {
    const include = [
      usersModelProvider.getIncludeAuthorForPreview(),

      postsModelProvider.getPostOfferItselfInclude(),
      postsModelProvider.getPostsStatsInclude(),

      orgModelProvider.getIncludeForPreview(),
      {
        model: models.posts,
        as: 'post',
        required: false,
        include: [
          usersModelProvider.getIncludeAuthorForPreview(),
          postsModelProvider.getPostsStatsInclude(),

          orgModelProvider.getIncludeForPreview(),
        ],
      },
      {
        model: models.post_users_team,
        as: 'post_users_team',
        required: false,
        include: [
          usersModelProvider.getIncludeAuthorForPreview(),
        ],
      },
    ];

    // #performance - make include optional
    const data = await PostsRepository.getModel().findOne({
      include,
      where: {
        id,
      },
    });

    if (!data) {
      return null;
    }

    return isRaw ? data.toJSON() : data;
  }

  static async findOneById(id, currentUserId: number | null = null, isRaw = false) {
    const include = [
      usersModelProvider.getIncludeAuthorForPreview(),

      postsModelProvider.getPostOfferItselfInclude(),
      postsModelProvider.getPostsStatsInclude(),

      orgModelProvider.getIncludeForPreview(),

      {
        attributes: models.comments.getFieldsForPreview(),
        model: models.comments,
        as: 'comments',
        required: false,
        include: [
          {
            model: models.Users,
            attributes: userPreviewAttributes,
            as: 'User',
          },
          {
            model: commentsRepository.getActivityUserCommentModel(),
            as: commentsRepository.getActivityUserCommentModelName(),
            required: false,
          },
          orgModelProvider.getIncludeForPreview(),
        ],
      },
      {
        model: models.posts,
        as: 'post',
        required: false,
        include: [
          usersModelProvider.getIncludeAuthorForPreview(),
          postsModelProvider.getPostsStatsInclude(),

          orgModelProvider.getIncludeForPreview(),
        ],
      },
      {
        model: models.post_users_team,
        as: 'post_users_team',
        required: false,
        include: [
          usersModelProvider.getIncludeAuthorForPreview(),
        ],
      },
    ];

    if (currentUserId) {
      include.push({
        model: models.activity_user_post,
        required: false,
        where: { user_id_from: currentUserId },
      });
    }

    // #performance - make include optional
    const data = await PostsRepository.getModel().findOne({
      include,
      where: {
        id,
      },
    });

    if (!data) {
      return data;
    }

    return isRaw ? data.toJSON() : data;
  }

  // noinspection JSUnusedGlobalSymbols
  static async findOneByIdAndAuthor(id, userId, raw = true) {
    return PostsRepository.getModel().findOne({
      raw,
      where: {
        id,
        user_id: userId,
      },
    });
  }

  // noinspection JSUnusedGlobalSymbols
  static async findAllWithRates() {
    // noinspection TypeScriptValidateJSTypes
    const rows = await PostsRepository.getModel().findAll({
      where: {
        current_rate: {
          [Op.gt]: 0,
        },
      },
      include: [{
        model: models.Users,
      }],
      order: [
        ['current_rate', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return rows.map(row => row.toJSON());
  }

  // noinspection JSUnusedGlobalSymbols
  static async findOneByBlockchainId(blockchainId) {
    return PostsRepository.getModel().findOne({
      where: {
        blockchain_id: blockchainId,
      },
      raw: true,
    });
  }

  /**
   *
   * @param {integer} userId
   * @returns {Promise<Object>}
   */
  static async findLastMediaPostByAuthor(userId) {
    return PostsRepository.getModel().findOne({
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__MEDIA_POST,
      },
      raw: true,
      order: [
        ['id', 'DESC'],
      ],
    });
  }

  /**
   *
   * @param {integer} userId
   * @returns {Promise<number>}
   */
  static async findLastMediaPostIdByAuthor(userId) {
    const result = await PostsRepository.getModel().findOne({
      attributes: [
        'id',
      ],
      where: {
        user_id: userId,
        post_type_id: POST_TYPE__MEDIA_POST,
      },
      raw: true,
      order: [
        ['id', 'DESC'],
      ],
    });

    return result ? result.id : null;
  }

  /**
   *
   * @param {number} userId
   * @return {Promise<*>}
   */
  static async findAllByAuthor(userId) {
    const queryParameters = {
      where: {
        user_id: userId,
      },
      order: [
        ['id', 'DESC'],
      ],
    };

    return this.findAllPosts(queryParameters);
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }

  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }

  /**
   *
   * @param {Object} data
   * @param {number} userId
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNewPost(data, userId, transaction) {
    data.user_id = userId;
    data.current_rate = 0;
    data.current_vote = 0;

    delete data.id;

    const newPost = await PostsRepository.getModel().create(data, { transaction });
    // @deprecated
    await postStatsRepository.createNew(newPost.id, transaction);

    return newPost;
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOnlyPostItselfById(id) {
    return model.findOne({
      where: { id },
      raw: true,
    });
  }

  public static async findAllWithTagsForTagCurrentRate(
    offset: number = 0,
    limit: number = 10,
  ): Promise<PostWithTagCurrentRateDto[]> {
    // it is ok for tag to have current_rate = 0 because post rate is decreased due to time
    // So WHERE current_rate > 0 for post is not ok for current_rate calculation

    return knex(TABLE_NAME)
      .select(['current_rate', 'entity_tags', 'post_type_id'])
      .whereRaw("entity_tags != '{}'")
      .offset(offset)
      .limit(limit)
    ;
  }

  public static async setCurrentRateToPost(postId: number, currentRate: number): Promise<void> {
    await knex(TABLE_NAME)
      .where('id', postId)
      .update({
        current_rate: currentRate,
      });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<number>}
   */
  static async getPostCurrentVote(id) {
    const result = await this.getModel().findOne({
      attributes: ['current_vote'],
      where: {
        id,
      },
      raw: true,
    });

    return result ? +result.current_vote : null;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<string|null>}
   */
  static async findBlockchainIdById(id) {
    const result = await this.getModel().findOne({
      attributes: [
        'blockchain_id',
      ],
      where: {
        id,
      },
      raw: true,
    });

    return result ? result.blockchain_id : null;
  }

  private static getDefaultOrderBy() {
    return [
      ['current_rate', 'DESC'],
      ['id', 'DESC'],
    ];
  }

  private static getDefaultListParams() {
    return {
      where: {},
      offset: 0,
      limit: 10,
      order: this.getDefaultOrderBy(),
    };
  }
}

export = PostsRepository;
