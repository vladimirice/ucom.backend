const models = require('../../../models');

const db = models.sequelize;

const postsModelProvider = require('../service/posts-model-provider');

class PostStatsRepository {
  static async createNew(postId, transaction) {
    return this.getModel().create({
      post_id: postId,
    }, { transaction });
  }

  static async increaseField(postId, field, increaseBy, transaction) {
    return this.getModel().update({
      [field]: db.literal(`${field} + ${increaseBy}`),
    },                                  {
      transaction,
      where: {
        post_id: postId,
      },
    });
  }

  static async findOneByPostId(postId, raw) {
    return this.getModel().findOne({
      raw,
      where: {
        post_id: postId,
      },
    });
  }

  /**
   *
   * @returns {Object}
   */
  static getModel() {
    return postsModelProvider.getPostStatsModel();
  }

  /**
   *
   * @returns {string}
   */
  static getModelName() {
    return 'post_stats';
  }
}

export = PostStatsRepository;
