const models = require('../../models');

class PostsRepository {
  static async findAllPosts() {
    return await PostsRepository.getModel().findAll({
      raw: true
    });
  }

  static async findOneById(id) {
    return await PostsRepository.getModel().findOne({
      where: {
        id: id
      }
    });
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