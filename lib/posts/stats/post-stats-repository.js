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
   * @param {Object} transaction
   * @returns {Promise<Object>}
   */
  static async increaseField(post_id, field, increaseBy, transaction) {
    return await this.getModel().update({
      [field]: db.literal(`${field} + ${increaseBy}`),
    }, {
      where: {
        post_id
      },
      transaction
    });
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

  /**
   *
   * @returns {Object}
   */
  static getModel() {
    return models[this.getModelName()];
  }

  /**
   *
   * @returns {string}
   */
  static getModelName() {
    return 'post_stats';
  }

}

module.exports = PostStatsRepository;