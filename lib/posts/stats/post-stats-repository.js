const models = require('../../../models');
const db = models.sequelize;

class PostStatsRepository {

  /**
   *
   * @param {number} post_id
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async createNew(post_id, transaction) {
    return await this.getModel().create({
      post_id
    }, { transaction });
  }

  /**
   *
   * @param {number} post_id
   * @param {string} field to increment
   * @param {number} increaseBy - integer
   * @returns {Promise<void>}
   */
  static async increaseField(post_id, field, increaseBy) {
    const result = await this.getModel().update({
      [field]: db.literal(`${field} + ${increaseBy}`),
    }, {
      where: {
        post_id
      }
    });

    const a = 0;

  }

  /**
   *
   * @param {number} post_id
   * @param {boolean} raw
   * @returns {Promise<Object>}
   */
  static async findOneByPostId(post_id, raw) {
    return await this.getModel().findOne({
      where: {
        post_id
      },
      raw
    });
  }

  static getModel() {
    return models['post_stats'];
  }

}

module.exports = PostStatsRepository;