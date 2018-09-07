const models = require('../../models');
const UserRepository = require('../users/users-repository');

const userPreviewAttributes = UserRepository.getModel().getFieldsForPreview();

class CommentsRepository {
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
   * @param {number} commentable_id
   * @returns {Promise<number>}
   */
  static async getWithMaxDepthByCommentableId(commentable_id) {
    return await this.getModel().findOne({
      where: {
        commentable_id
      },
      order: [
        ['depth', 'DESC']
      ],
      limit: 1
    });
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

  static getModel() {
    return models['comments'];
  }
}

module.exports = CommentsRepository;