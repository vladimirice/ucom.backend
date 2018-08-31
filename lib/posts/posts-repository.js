const models = require('../../models');
const uniqid = require('uniqid');
const Op = models.sequelize.Op;

const PostTypeDictionary = require('./post-type-dictionary');

const POST_TYPE__MEDIA_POST = PostTypeDictionary.getTypeMediaPost();

class PostsRepository {
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
    const data = await PostsRepository.getModel().findAll({
      include: [{
          model: models['Users'],
        },
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
        model: models['Users'],
      },
      {
        model: models['post_offer']
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

  static async findOneByBlockchainId(blockchain_id) {
    return await PostsRepository.getModel().findOne({
      where: {
        blockchain_id
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

  static getUniqId(postId) {
    const typePrefix = 'pstms';
    const prefix = `${typePrefix}${postId}-`;

    return uniqid(prefix);
  }
}

module.exports = PostsRepository;