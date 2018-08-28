const models = require('../../models');
const uniqid = require('uniqid');

class PostsRepository {
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

  static async findOneById(id, isRaw = false) {
    // TODO #performance - make include optional
    const data = await PostsRepository.getModel().findOne({
      where: {
        id: id
      },
      include: [{
          model: models['Users'],
        },
      ],
    });

    if (!data) {
      return data;
    }

    return isRaw ? data.toJSON() : data;
  }

  static async findOneByIdAndAuthor(id, user_id, isRaw = true) {
    return await PostsRepository.getModel().findOne({
      where: {
        id,
        user_id
      },
      raw: isRaw
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