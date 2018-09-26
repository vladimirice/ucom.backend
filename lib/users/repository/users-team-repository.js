const models = require('../../../models');
const UsersModelProvider = require('../users-model-provider');

const TABLE_NAME = 'users_team';

class UsersTeamRepository {

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async createNew(data, transaction) {
    return await this.getModel().create(data, transaction);
  }

  static async findAllRelatedToEntity(entity_name, entity_id) {
    const where = {
      entity_name,
      entity_id
    };

    return await UsersModelProvider.getUsersTeamModel().findAll({
      where,
      raw: true
    });
  }

  static getInclude() {
    return {
      model: this.getModel(),
    }
  }

  /**
   *
   * @return {Object}
   */
  static getModel() {
    return models[TABLE_NAME];
  }

  /**
   *
   * @return {string}
   */
  static getModelName() {
    return TABLE_NAME;
  }
}

module.exports = UsersTeamRepository;