const models = require('../../models');

const BLOCKCHAIN_COMMENT_PREFIX = 'cmmnt';

class CommentsRepository {

  static async createNew(data) {
    const newPost = await this.getModel().create(data);

    await newPost.update({
      'blockchain_id': this.getUniqId(newPost.id)
    });

    return newPost;
  }

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

  static getUniqId(id) {
    const prefix = `${BLOCKCHAIN_COMMENT_PREFIX}${id}-`;

    return uniqid(prefix);
  }


  static getModel() {
    return models['comments'];
  }
}

module.exports = CommentsRepository;