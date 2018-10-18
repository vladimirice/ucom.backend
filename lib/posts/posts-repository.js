const models = require('../../models');
const Op = models.sequelize.Op;
const { ContentTypeDictionary } = require('uos-app-transaction');

const POST_TYPE__MEDIA_POST = ContentTypeDictionary.getTypeMediaPost();
const UserRepository = require('../../lib/users/users-repository');
const userPreviewAttributes = UserRepository.getModel().getFieldsForPreview();
const PostStatsRepository = require('./stats/post-stats-repository');
const CommentsRepository = require('../comments/comments-repository');
const OrgModelProvider = require('../organizations/service/organizations-model-provider');
const PostsModelProvider = require('./service').ModelProvider;
const UsersModelProvider = require('../users/service').ModelProvider;

const TABLE_NAME = 'posts';

const model = PostsModelProvider.getModel();

const _ = require('lodash');

class PostsRepository {

  /**
   *
   * @param {number} id
   * @param {number} by
   * @returns {Promise<*>}
   */


  static async incrementCurrentVoteCounter(id, by = 1) {
    return await this.getModel().increment('current_vote', {
      by,
      where: {
        id
      }
    });
  }

  /**
   *
   * @param {number} id
   * @param {number} by
   * @returns {Promise<*>}
   */
  static async decrementCurrentVoteCounter(id, by = 1) {
    return await this.getModel().decrement('current_vote', {
      by,
      where: {
        id
      }
    });
  }

  static async findLastByAuthor(user_id, isRaw = true) {
    const data = await this.getModel().findOne({
      where: {
        user_id,
        post_type_id: POST_TYPE__MEDIA_POST
      },
      order: [
        ['id', 'DESC']
      ],
      limit: 1
    });

    return isRaw ? data.toJSON() : data;
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<number|null>}
   */
  static async findFirstMediaPostIdUserId(user_id) {
    const data = await this.getModel().findOne({
      attributes: [ 'id' ],
      where: {
        user_id,
        post_type_id: POST_TYPE__MEDIA_POST
      },
      order: [
        ['id', 'DESC']
      ],
      limit: 1,
      raw: true,
    });

    return data ? data.id : null;
  }
  /**
   *
   * @param {number} user_id
   * @return {Promise<number|null>}
   */
  static async findLastMediaPostIdUserId(user_id) {
    const data = await this.getModel().findOne({
      attributes: [ 'id' ],
      where: {
        user_id,
        post_type_id: POST_TYPE__MEDIA_POST
      },
      order: [
        ['id', 'ASC']
      ],
      limit: 1,
      raw: true,
    });

    return data ? data.id : null;
  }

  static async findLast(isRaw = true) {
    const data = await this.getModel().findOne({
      where: {
        post_type_id: POST_TYPE__MEDIA_POST
      },
      order: [
        ['id', 'DESC']
      ],
      limit: 1
    });

    return isRaw ? data.toJSON() : data;
  }

  /**
   *
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findAllMediaPosts(raw = true) {
    return await this.getModel().findAll({
      where: {
        post_type_id: POST_TYPE__MEDIA_POST
      },
      raw
    });
  }

  /**
   *
   * @param {Object | null} queryParameters
   * @returns {Promise<number>}
   */
  static async countAllPosts(queryParameters = null) {
    return await PostsRepository.getModel().count({
      where: queryParameters ? queryParameters['where'] : {},
    });
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMinPostIdByParameter(field) {
    let order = [];

    order[0] = [field, 'ASC'];
    order[1] = ['id', 'DESC'];

    const result = await PostsRepository.getModel().findOne({
      attributes: [
        'id'
      ],
      limit: 1,
      order,
      raw: true
    });

    return result ? result['id'] : null;
  }

  /**
   *
   * @param {string} field
   * @returns {Promise<Object>}
   */
  static async findMaxPostIdByParameter(field) {
    let order = [];

    order[0] = [field, 'DESC'];
    order[1] = ['id', 'DESC'];

    const result = await PostsRepository.getModel().findOne({
      attributes: [
        'id'
      ],
      limit: 1,
      order,
      raw: true
    });

    return result ? result['id'] : null;
  }


  static _getDefaultOrderBy() {
    return [
      ['current_rate', 'DESC'],
      ['id', 'DESC'],
    ];
  }

  static _getDefaultListParams() {
    return {
      where: {},
      offset: 0,
      limit: 10,
      order: this._getDefaultOrderBy(),
    }
  }

  /**
   *
   * @param {Object|null} queryParameters
   * @return {Promise<any[]>}
   */
  static async findAllPosts(queryParameters = {}) {
    const attributes  = this.getModel().getFieldsForPreview();

    const params = _.defaults(queryParameters, this._getDefaultListParams());

    const include = [
      OrgModelProvider.getIncludeForPreview(),
      UsersModelProvider.getIncludeAuthorForPreview(),
      PostsModelProvider.getPostsStatsInclude(),
      PostsModelProvider.getPostOfferItselfInclude()
    ];

    const models = await PostsModelProvider.getModel().findAll({
      attributes,
      include,
      ...params
    });

    return models.map(model => {
      return model.toJSON();
    });
  }

  // noinspection JSUnusedGlobalSymbols
  static async findOneForIpfs(id, post_type_id) {
    const PostOfferAttributes = models['post_offer'].getPostOfferAttributesForIpfs();

    const include = [
      {
        attributes: ['account_name'],
        model: models['Users'],
      }
    ];

    if (post_type_id === ContentTypeDictionary.getTypeOffer()) {
      include.push({
        attributes: PostOfferAttributes,
        model: models['post_offer']
      });
    }

    const postAttributes = this.getModel().getMediaPostAttributesForIpfs();

    return await this.getModel().findOne({
      attributes: postAttributes,
      where: {
        id,
        post_type_id
      },
      include,
      raw: true,
    });
  }

  static async findOneOnlyWithOrganization(id) {
    const res = await this.getModel().findOne({
      where: {
        id: id
      },
      include: [
        OrgModelProvider.getModel(),
      ],
    });

    return res ? res.toJSON() : null;
  }

  static async findOneById(id, currentUserId, isRaw = false) {
    let include = [
      UsersModelProvider.getIncludeAuthorForPreview(),

      PostsModelProvider.getPostOfferItselfInclude(),
      PostsModelProvider.getPostsStatsInclude(),

      OrgModelProvider.getIncludeForPreview(),

      {
        attributes: models.comments.getFieldsForPreview(),
        model: models['comments'],
        as: 'comments',
        required: false,
        include: [
          {
            model: models['Users'],
            attributes: userPreviewAttributes,
            as: 'User'
          },
          {
            model: CommentsRepository.getActivityUserCommentModel(),
            as: CommentsRepository.getActivityUserCommentModelName(),
            required: false,
          },
          OrgModelProvider.getIncludeForPreview(),
        ]
      },
      {
        model: models['post_users_team'],
        as: 'post_users_team',
        required: false,
        include: [
          {
            model: models['Users'],
            attributes: userPreviewAttributes,
          }
        ]
      }
    ];

    if (currentUserId) {
      include.push({
        model: models['activity_user_post'],
        required: false,
        where: {user_id_from: currentUserId}
      })
    }

    // TODO #performance - make include optional
    const data = await PostsRepository.getModel().findOne({
      where: {
        id: id
      },
      include,
    });

    if (!data) {
      return data;
    }

    return isRaw ? data.toJSON() : data;
  }

  static async findOneByIdAndAuthor(id, user_id, raw = true) {
    return await PostsRepository.getModel().findOne({
      where: {
        id,
        user_id
      },
      raw
    });
  }

  static async findAllWithRates() {
    let rows = await PostsRepository.getModel().findAll({
      where: {
        current_rate: {
          [Op.gt]: 0
        },
      },
      include: [{
        model: models['Users'],
      }],
      order: [
        ['current_rate', 'DESC'],
        ['id', 'DESC']
      ],
    });

    return rows.map(row => {
      return row.toJSON();
    });
  }

  // noinspection JSUnusedGlobalSymbols
  static async findOneByBlockchainId(blockchain_id) {
    return await PostsRepository.getModel().findOne({
      where: {
        blockchain_id
      },
      raw: true,
    });
  }

  /**
   *
   * @param {integer} user_id
   * @returns {Promise<Model>}
   */
  static async findLastMediaPostByAuthor(user_id) {
    return await PostsRepository.getModel().findOne({
      where: {
        user_id,
        post_type_id: POST_TYPE__MEDIA_POST
      },
      raw: true,
      order: [
        ['id', 'DESC']
      ]
    });
  }

  /**
   *
   * @param {integer} user_id
   * @returns {Promise<number>}
   */
  static async findLastMediaPostIdByAuthor(user_id) {
    const result = await PostsRepository.getModel().findOne({
      attributes: [
        'id'
      ],
      where: {
        user_id,
        post_type_id: POST_TYPE__MEDIA_POST
      },
      raw: true,
      order: [
        ['id', 'DESC']
      ]
    });

    return result ? result['id'] : null;
  }

  /**
   *
   * @param {number} user_id
   * @return {Promise<*>}
   */
  static async findAllByAuthor(user_id) {
    const queryParameters = {
      where: {
        user_id
      },
      order: [
        ['id', 'DESC']
      ]
    };

    return await this.findAllPosts(queryParameters);
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
    data['user_id'] = userId;
    data['current_rate'] = 0;
    data['current_vote'] = 0;

    const newPost = await PostsRepository.getModel().create(data, { transaction });
    await PostStatsRepository.createNew(newPost.id, transaction);

    return newPost;
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOnlyPostItselfById(id) {
    return await model.findOne({
      where: { id },
      raw: true
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
      raw: true
    });

    return result ? +result['current_vote'] : null;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<string|null>}
   */
  static async findBlockchainIdById(id) {
    const result = await this.getModel().findOne({
      attributes: [
        'blockchain_id'
      ],
      where: {
        id
      },
      raw: true,
    });

    return result ? result.blockchain_id : null;
  }
}

module.exports = PostsRepository;