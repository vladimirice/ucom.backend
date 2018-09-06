const models = require('../../models');



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
          attributes: [
            'id', 'account_name', 'first_name', 'last_name', 'nickname', 'avatar_filename',
          ],
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
  static async getMaxDepthByCommentableId(commentable_id) {
    const result = await this.getModel().findOne({
      attributes: [
        'depth'
      ],
      where: {
        commentable_id
      },
      order: [
        ['depth', 'DESC']
      ],
      limit: 1
    });

    return result ? result.depth : null;
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