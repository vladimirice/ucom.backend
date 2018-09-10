const models = require('../../../models');

class PostStatsRepository {

  /**
   *
   * @param {number} post_id
   * @returns {Promise<Object>}
   */
  static async createNew(post_id) {
    return await this.getModel().create({
      post_id
    });
  }

  /**
   *
   * @param {number} post_id
   * @returns {Promise<Object>}
   */
  static async findOneByPostId(post_id) {
    return await this.getModel().findOne({
      where: {
        post_id
      }
    });
  }

  static getModel() {
    return models['post_stats'];
  }

}

module.exports = PostStatsRepository;