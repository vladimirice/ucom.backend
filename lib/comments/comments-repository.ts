import { DbParamsDto } from '../api/filters/interfaces/query-filter-interfaces';
import {
  NumberToNumberCollection,
} from '../common/interfaces/common-types';
import { DbCommentParamsDto } from './interfaces/query-filter-interfaces';
import { CommentModel, ParentIdToDbCommentCollection } from './interfaces/model-interfaces';

const _ = require('lodash');

const models = require('../../models');

const db = models.sequelize;
const { Op } = db;

const orgModelProvider = require('../organizations/service').ModelProvider;
const commentsModelProvider = require('./service').ModelProvider;
const usersModelProvider = require('../users/service').ModelProvider;

const userPreviewAttributes = usersModelProvider.getUserFieldsForPreview();

const model = commentsModelProvider.getModel();

class CommentsRepository {
  /**
   *
   * @return {Object[]}
   */
  static getCommentIncludedModels() {
    return [
      {
        model: usersModelProvider.getUsersModel(),
        attributes: userPreviewAttributes,
        as: 'User',
      },

      {
        model: this.getActivityUserCommentModel(),
        as: this.getActivityUserCommentModelName(),
        required: false,
      },
      orgModelProvider.getIncludeForPreview(),
    ];
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<string|null>}
   */
  static async findBlockchainIdById(id) {
    const result = await this.getModel().findOne({
      attributes: ['blockchain_id'],
      where: { id },
      raw: true,
    });

    return result ? result.blockchain_id : null;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<*>}
   */
  static async incrementCurrentVoteCounter(id) {
    return this.getModel().update({
      current_vote: db.literal('current_vote + 1'),
    }, {
      where: {
        id,
      },
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<*>}
   */
  static async decrementCurrentVoteCounter(id) {
    return this.getModel().update({
      current_vote: db.literal('current_vote - 1'),
    }, {
      where: {
        id,
      },
    });
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<number>}
   */
  static async getCommentCurrentVote(id) {
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
   * @returns {Promise<void>}
   */
  static async findOneById(id) {
    const attributes = model.getFieldsForPreview();

    const where = {
      id,
    };
    const include = this.getCommentIncludedModels();

    const res = await this.getModel().findOne({
      attributes,
      where,
      include,
    });

    return res.toJSON();
  }

  public static async countAllByParentIdAndDepth(
    parentId: number,
    depth: number,
  ): Promise<number> {
    const where = {
      depth,
      parent_id: parentId,
    };

    return model.count({ where });
  }

  public static async countNextDepthTotalAmounts(
    commentableIds: number[],
    depth: number,
  ): Promise<NumberToNumberCollection> {
    if (commentableIds.length === 0) {
      return {};
    }

    const sql: string = `
    SELECT parent_id, COUNT(1) as amount FROM comments
    WHERE
      depth = ${+depth} -- next depth level
      AND parent_id IS NOT NULL -- for reference, for depth >= 1 parent_id must always be NOT NULL
      AND commentable_id IN (${commentableIds.join(', ')})
    GROUP BY parent_id;
    `;

    const data = await db.query(sql, { type: db.QueryTypes.SELECT });

    const res: NumberToNumberCollection = {};

    data.forEach((item) => {
      res[item.parent_id] = +item.amount;
    });

    return res;
  }

  public static async countAllByCommentableId(
    commentableId: number,
    params: DbParamsDto,
  ): Promise<number> {
    params.where.commentable_id = commentableId;

    return model.count({ where: params.where });
  }

  public static async countAllByCommentableIdsAndDepth(
    commentableIds: number[],
    params: DbCommentParamsDto,
  ): Promise<NumberToNumberCollection> {
    const where = {
      ...params.where,
      commentable_id: {
        [Op.in]: commentableIds,
      },
    };

    // #task IDE collision
    // noinspection TypeScriptValidateJSTypes
    const data: {commentable_id: number, comments_amount: string}[] = await model.findAll({
      where,
      raw: true,
      group: ['commentable_id'],
      attributes: [
        'commentable_id',
        [db.fn('COUNT', 'id'), 'comments_amount'],
      ],
    });

    const res: NumberToNumberCollection = {};
    data.forEach((item) => {
      res[item.commentable_id] = +item.comments_amount;
    });

    return res;
  }

  public static async countAllByDbParamsDto(
    params: DbParamsDto,
  ): Promise<number> {
    return model.count({ where: params.where });
  }

  // #task - it is supposed that commentable ID is always Post
  public static async findAllByCommentableId(
    commentableId: number,
    queryParameters: DbParamsDto,
  ) {
    // #task - move to separateQueryService
    const params = _.defaults(queryParameters, this.getDefaultListParams());

    params.where.commentable_id = commentableId;

    // #task - exclude user related activity to separate request, as for posts
    params.include = this.getCommentIncludedModels();

    const result = await model.findAll(params);

    return result.map(data => data.toJSON());
  }

  // #task - it is supposed that commentable ID is always Post
  public static async findAllByManyCommentableIds(
    commentableIds: number[],
    queryParameters: DbParamsDto,
  ): Promise<ParentIdToDbCommentCollection> {
    // #task - move to separateQueryService
    const params = _.defaults(queryParameters, this.getDefaultListParams());

    params.where.commentable_id = {
      [Op.in]: commentableIds,
    };

    // #task - exclude user related activity to separate request, as for posts
    params.include = this.getCommentIncludedModels();

    const data = await model.findAll(params);

    const res: ParentIdToDbCommentCollection = {};
    data.forEach((row) => {
      const jsonRow: CommentModel = row.toJSON();
      const commentableId: number = jsonRow.commentable_id;
      if (res[commentableId]) {
        res[commentableId].push(jsonRow);
      } else {
        res[commentableId] = [jsonRow];
      }
    });

    return res;
  }

  public static async findAllByDbParamsDto(
    queryParameters: DbCommentParamsDto,
  ) {
    // #task - move to separateQueryService
    const params = _.defaults(queryParameters, this.getDefaultListParams());

    // #task - exclude user related activity to separate request, as for posts
    params.include = this.getCommentIncludedModels();

    const result = await model.findAll(params);

    return result.map(data => data.toJSON());
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} id - comment ID
   * @returns {Promise<string|null>}
   */
  static async getPathById(id) {
    const result = await this.getModel().findOne({
      attributes: [
        'path',
      ],
      where: {
        id,
      },
      raw: true,
    });

    return result ? result.path : null;
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async createNew(data, transaction) {
    return this.getModel().create(data, transaction);
  }

  static getModel() {
    return models.comments;
  }

  /**
   *
   * @returns {Object}
   */
  static getActivityUserCommentModel() {
    return models[this.getActivityUserCommentModelName()];
  }

  /**
   * @param {number} userId
   */
  static async findLastCommentByAuthor(userId) {
    const result = await this.getModel().findOne({
      where: {
        user_id: userId,
      },
      order: [
        ['id', 'DESC'],
      ],
      raw: true,
    });

    if (result) {
      result.path = JSON.parse(result.path);
    }

    return result;
  }

  /**
   *
   * @returns {string}
   */
  static getActivityUserCommentModelName() {
    return 'activity_user_comment';
  }

  /**
   *
   * @returns {Function}
   */
  public static getWhereProcessor() {
    return (query, params: DbParamsDto) => {
      if (!params.where) {
        params.where = {};
      }

      if (query === null) {
        return;
      }

      const allowedInt = [
        'depth',
        'parent_id',
        'commentable_id',
      ];

      allowedInt.forEach((item) => {
        if (query[item] !== undefined) {
          params.where[item] = +query[item];
        }
      });
    };
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @returns {Object}
   */
  static getOrderByRelationMap() {
    return {};
  }

  // noinspection JSUnusedGlobalSymbols
  static getAllowedOrderBy(): string[] {
    return [];
  }

  private static getDefaultOrderBy() {
    return [
      ['id', 'ASC'],
    ];
  }

  public static getDefaultListParams() {
    return {
      attributes: model.getFieldsForPreview(),
      where: {},
      offset: 0,
      limit: 10,
      order: this.getDefaultOrderBy(),
    };
  }
}

export = CommentsRepository;
