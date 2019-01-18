import { DbParamsDto } from '../api/filters/interfaces/query-filter-interfaces';
import { StringToNumberCollection } from '../common/interfaces/common-types';

const models = require('../../models');
const db = models.sequelize;

const _ = require('lodash');

const orgModelProvider      = require('../organizations/service').ModelProvider;
const commentsModelProvider = require('./service').ModelProvider;
const usersModelProvider    = require('../users/service').ModelProvider;
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
        model:  this.getActivityUserCommentModel(),
        as:     this.getActivityUserCommentModelName(),
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
    return await this.getModel().update({
      current_vote: db.literal('current_vote + 1'),
    },                                  {
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
    return await this.getModel().update({
      current_vote: db.literal('current_vote - 1'),
    },                                  {
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

    return result ? +result['current_vote'] : null;
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

  public static async countNextDepthTotalAmount(
    depth: number,
    commentableId: number,
  ): Promise<StringToNumberCollection> {

    const sql: string = `
    SELECT parent_id, COUNT(1) as amount FROM comments
    WHERE
      depth = ${+depth} -- next depth level
      AND parent_id IS NOT NULL -- for reference, for depth = 1 parent_id must always be NOT NULL
      AND commentable_id = ${+commentableId}
    GROUP BY parent_id;
    `;

    const data = await db.query(sql, { type: db.QueryTypes.SELECT });

    const res: any = {};

    data.forEach((item) => {
      res[item.parent_id] = item.amount;
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

    return result ? result['path'] : null;
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async createNew(data, transaction) {
    return await this.getModel().create(data, transaction);
  }

  static getModel() {
    return models['comments'];
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
    return function (query, params) {
      if (!params.where) {
        params.where = {};
      }

      if (query === null || query.depth === undefined) {
        return;
      }

      params.where.depth = +query.depth;
    };
  }

  /**
   *
   * @returns {Object}
   */
  static getOrderByRelationMap() {
    return {};
  }

  static getAllowedOrderBy(): string[] {
    return [];
  }

  private static getDefaultOrderBy() {
    return [
      ['id', 'DESC'],
    ];
  }

  private static getDefaultListParams() {
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
