const models = require('../../models');
const db = models.sequelize;
const UserRepository = require('../users/users-repository');

const userPreviewAttributes = UserRepository.getModel().getFieldsForPreview();

class CommentsRepository {

  /**
   *
   * @param {number} id
   * @returns {Promise<*>}
   */
  static async incrementCurrentVoteCounter(id) {
    return await this.getModel().update({
      current_vote: db.literal(`current_vote + 1`),
    }, {
      where: {
        id
      }
    });
  }

  /**
   *
   * @param {number} user_id
   * @returns {Promise<number | null>}
   */
  static async getLastCommentIdByUserId(user_id) {
    const result = await this.getModel().findOne({
      attributes: ['id'],
      where: {
        user_id
      },
      order: [
        ['id', 'DESC']
      ]
    });

    return result ? result['id'] : null;
  }

  /**
   *
   * @param {number} id
   * @returns {Promise<number>}
   */
  static async getCommentCurrentVote(id) {
    const result = await this.getModel().findOne({
      attributes: ['current_vote'],
      where: {
        id,
      },
      raw: true
    });

    return result ? +result['current_vote'] : null;

  }

  /**
   *
   * @param {number} id
   * @returns {Promise<void>}
   */
  static async findOneById(id) {
    return await this.getModel().findOne({
      where: {
        id,
      },
      include: [
        {
          model: models['Users'],
          attributes: userPreviewAttributes,
          as: 'User'
        },
      ]
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   *
   * @param {number} id - comment ID
   * @returns {Promise<string|null>}
   */
  static async getPathById(id) {
    const result = await this.getModel().findOne({
      attributes: [
        'path'
      ],
      where: {
        id
      },
      raw: true
    });

    return result ? result['path'] : null;
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @returns {Promise<void>}
   */
  static async createNew(data, transaction) {
    return await this.getModel().create(data, transaction);
  }

  static getModel() {
    return models['comments'];
  }

  /**
   *
   * @returns {Object}
   */
  static getActivityUserCommentModel() {
    return models[this.getActivityUserCommentModelName()];
  }

  /**
   * @param {number} user_id
   * @returns {Promise<Model>}
   */
  static async findLastCommentByAuthor(user_id) {
    const result = await this.getModel().findOne({
      where: {
        user_id,
      },
      order: [
        ['id', 'DESC']
      ],
      raw: true,
    });

    if (result) {
      result.path = JSON.parse(result.path);
    }

    return result;
  }

  /**
   *
   * @returns {string}
   */
  static getActivityUserCommentModelName() {
    return 'activity_user_comment'
  }
}

module.exports = CommentsRepository;