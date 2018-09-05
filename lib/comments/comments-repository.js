const models = require('../../models');

class CommentsRepository {

  /**
   * @param {number} user_id
   * @returns {Promise<Model>}
   */
  static async findLastCommentByAuthor(user_id) {
    return await this.getModel().findOne({
      where: {
       user_id,
      },
      order: [
        ['id', 'DESC']
      ]
    });
  }

  static getModel() {
    return models['comments'];
  }
}

module.exports = CommentsRepository;