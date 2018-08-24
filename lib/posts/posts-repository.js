const models = require('../../models');

class PostsRepository {
  static async findAllPosts() {
    return await PostsRepository.getModel().findAll({
      raw: true
    });
  }

  static async findOneById(id, isRaw = false) {
    return await PostsRepository.getModel().findOne({
      where: {
        id: id
      },
      raw: isRaw
    });
  }

  static async findOneByIdAndAuthor(id, user_id) {
    return await PostsRepository.getModel().findOne({
      where: {
        id,
        user_id
      }
    });
  }

  static async findAllByAuthor(userId, isRaw = true) {
    return await PostsRepository.getModel().findAll({
      where: {
        user_id: userId
      },
      raw: isRaw
    });
  }

  static async findAuthorFistPost(userId, isRaw) {
    // TODO #refactor - use order by limit
    const posts = await PostsRepository.findAllByAuthor(userId, isRaw);

    return posts[0];
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