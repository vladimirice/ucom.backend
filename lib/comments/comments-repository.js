const models = require('../../models');



class CommentsRepository {

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
   * @returns {Promise<void>}
   */
  static async createNew(data) {
    return await this.getModel().create(data);
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