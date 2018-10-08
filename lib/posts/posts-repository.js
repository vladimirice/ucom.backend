const models = require('../../models');
const uniqid = require('uniqid');
const Op = models.sequelize.Op;
const PostTypeDictionary = require('./post-type-dictionary');
const POST_TYPE__MEDIA_POST = PostTypeDictionary.getTypeMediaPost();
const UserRepository = require('../../lib/users/users-repository');
const userPreviewAttributes = UserRepository.getModel().getFieldsForPreview();
const PostStatsRepository = require('./stats/post-stats-repository');
const CommentsRepository = require('../comments/comments-repository');
const OrgModelProvider = require('../organizations/service/organizations-model-provider');

const TABLE_NAME = 'posts';

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

  /**
   *
   * @param {boolean} isRaw
   * @param {Object|null} queryParameters
   * @returns {Promise<*>}
   */
  static async findAllPosts(isRaw = true, queryParameters = null) {

    const attributes = this.getModel().getFieldsForPreview();
    const userAttributes = UserRepository.getModel().getFieldsForPreview();

    const data = await PostsRepository.getModel().findAll({
      attributes,
      where: queryParameters ? queryParameters['where'] : {},
      limit:    queryParameters ? queryParameters['limit'] : null,
      offset:   queryParameters ? queryParameters['offset']: null,
      include: [
        {
          attributes: userAttributes,
          model: models['Users'],
        },
        {
          model: PostStatsRepository.getModel(),
          as: PostStatsRepository.getModelName(),
          required: true,
        },
        {
          model: models['activity_user_post']
        }
      ],
      order: queryParameters ? queryParameters['order'] : null,
      subQuery: true
    });

    if (isRaw) {
      return data.map(data => {
        return data.toJSON();
      });
    }

    return data;
  }

  static async findOneForIpfs(id, post_type_id) {
    const PostOfferAttributes = models['post_offer'].getPostOfferAttributesForIpfs();

    const include = [
      {
        attributes: ['account_name'],
        model: models['Users'],
      }
    ];

    if (post_type_id === PostTypeDictionary.getTypeOffer()) {
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

  /**
   *
   * @param {number} user_id
   * @param {number} organization_id
   * @return {Promise<Object>}
   */
  static async findOneByAuthorAndOrganization(user_id, organization_id) {
    return await this.getModel().findOne({
      where: {
        user_id,
        organization_id
      },
      raw: true,
    })
  }

  /**
   *
   * @param {number} id
   * @return {Promise<Object>}
   */
  static async findOnlyPostItselfById(id) {
    return await this.getModel().findOne({
      where: { id: id },
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
      {
        attributes: userPreviewAttributes,
        model: models['Users'],
      },
      {
        model: models['post_offer']
      },
      {
        model: models['comments'],
        as: 'comments',
        include: [
          {
            model: models['Users'],
            attributes: userPreviewAttributes,
            as: 'User'
          },
          {
            model: CommentsRepository.getActivityUserCommentModel(),
            as: CommentsRepository.getActivityUserCommentModelName(),
          },
          OrgModelProvider.getIncludeForPreview(),
        ]
      },
      {
        model: models['post_users_team'],
        as: 'post_users_team',
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

  static async findAllByAuthor(userId, isRaw = true) {
    const data = await PostsRepository.getModel().findAll({
      where: {
        user_id: userId
      },
      order: [
        ['id', 'DESC']
      ],
    });

    if (isRaw) {
      return data.map(data => {
        return data.toJSON();
      });
    }

    return data;
  }

  /**
   *
   * @param {number} organization_id
   * @param {boolean} isRaw
   * @return {Promise<*>}
   */
  static async findAllByOrganization(organization_id, isRaw = true) {
    // TODO - refactor move includes to ModelProvider
    const userAttributes = UserRepository.getModel().getFieldsForPreview();

    const data = await PostsRepository.getModel().findAll({
      where: {
        organization_id
      },
      include: [
        {
          attributes: userAttributes,
          model: models['Users'],
        },
        {
          model: models['organizations'],
        },
      ],
      order: [
        ['id', 'DESC']
      ],
    });

    if (isRaw) {
      return data.map(data => {
        return data.toJSON();
      });
    }

    return data;
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

  /**
   *
   * @return {string}
   */
  static getPostsModelName() {
    return TABLE_NAME;
  }
}

module.exports = PostsRepository;