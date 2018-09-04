const models = require('../../models');

class CommentsRepository {
  static async findLastCommentByAuthor(user_id) {
    // TODO
  }

  static getModel() {
    return models['comments'];
  }
}

module.exports = CommentsRepository;