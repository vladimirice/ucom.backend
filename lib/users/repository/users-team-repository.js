const models = require('../../../models');
const UsersModelProvider = require('../users-model-provider');

const TABLE_NAME = 'users_team';

const model = UsersModelProvider.getUsersTeamModel();

const StatusDictionary = require('../dictionary').UsersTeamStatus;

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

  /**
   *
   * @param {string} entity_name
   * @param {number} entity_id
   * @param {number} user_id
   * @param {Object} transaction
   * @return {Promise<*>}
   */
  static async setStatusConfirmed(entity_name, entity_id, user_id, transaction) {
    const where = {
      entity_name,
      entity_id,
      user_id
    };

    const data = {
      status: StatusDictionary.getStatusConfirmed(),
    };

    return await model.update(data, {where, transaction });
  }

  /**
   *
   * @param {string} entity_name
   * @param {number} entity_id
   * @param {number} user_id
   * @param {Object} transaction
   * @return {Promise<*>}
   */
  static async setStatusDeclined(entity_name, entity_id, user_id, transaction) {
    const where = {
      entity_name,
      entity_id,
      user_id
    };

    const data = {
      status: StatusDictionary.getStatusDeclined(),
    };

    return await model.update(data, {where, transaction });
  }

  /**
   *
   * @param {string} entity_name
   * @param {number} entity_id
   * @param {number} user_id
   * @return {Promise<boolean>}
   */
  static async isTeamMember(entity_name, entity_id, user_id) {
    const where = {
      entity_id,
      entity_name,
      user_id
    };

    const res = await model.count({
      where,
    });

    return !!res;
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