const models = require('../../models');

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

    return PostsRepository.getModel().create(data);
  }
}

module.exports = PostsRepository;