const models = require('../../models');
const uniqid = require('uniqid');
const Op = models.sequelize.Op;
const PostTypeDictionary = require('./post-type-dictionary');
const POST_TYPE__MEDIA_POST = PostTypeDictionary.getTypeMediaPost();
const UserRepository = reqlib('/lib/users/users-repository');
const userPreviewAttributes = UserRepository.getModel().getFieldsForPreview();


class PostsRepository {
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

  static async findAllPosts(isRaw = true) {

    const attributes = this.getModel().getFieldsForPreview();
    const userAttributes = UserRepository.getModel().shortUserInfoFields();

    const data = await PostsRepository.getModel().findAll({
      attributes,
      include: [{
          attributes: userAttributes,
          model: models['Users'],
        },
        {
          model: models['activity_user_post']
        }
      ],
      order: [
        ['current_rate', 'DESC'],
        ['id', 'DESC']
      ]
    });

    if (isRaw) {
      return data.map(data => {
        return data.toJSON();
      });
    }

    return data;
  }

  static async findOneById(id, currentUserId, isRaw = false) {
    let include = [
      {
        attributes: userPreviewAttributes,
        model: models['Users'],
        include: [
          {
            model: models['activity_user_user'],
            as: 'followed_by'
          },
        ]
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
    });
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

  static getModel() {
    return models['posts'];
  }

  static async createNewPost(data, user) {
    data['user_id'] = user.id;
    data['current_rate'] = 0;
    data['current_vote'] = 0;

    const newPost = await PostsRepository.getModel().create(data);

    await newPost.update({
      'blockchain_id': PostsRepository.getUniqId(newPost.id)
    });

    return newPost;
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

  static getUniqId(postId) {
    const typePrefix = 'pstms';
    const prefix = `${typePrefix}${postId}-`;

    return uniqid(prefix);
  }
}

module.exports = PostsRepository;