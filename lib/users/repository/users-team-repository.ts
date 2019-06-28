import knex = require('../../../config/knex');

const models = require('../../../models');
const usersModelProvider  = require('../users-model-provider');
const usersTeamDictionary = require('../dictionary').UsersTeamStatus;

const TABLE_NAME = 'users_team';

const model = usersModelProvider.getUsersTeamModel();

const statusDictionary = require('../dictionary').UsersTeamStatus;

class UsersTeamRepository {
  public static async deleteAllByEntityIdEntityName(entityId: number, entityName: string): Promise<void> {
    await knex(TABLE_NAME)
      .delete()
      .where({
        entity_id: entityId,
        entity_name: entityName,
      });
  }

  /**
   *
   * @param {Object} data
   * @param {Object} transaction
   * @return {Promise<Object>}
   */
  static async createNew(data, transaction) {
    return this.getModel().create(data, transaction);
  }

  static async setStatusConfirmed(entityName, entityId, userId, transaction = null) {
    const where = {
      entity_name: entityName,
      entity_id: entityId,
      user_id: userId,
    };

    const data = {
      status: statusDictionary.getStatusConfirmed(),
    };

    return model.update(data, { where, transaction });
  }

  static async setStatusDeclined(entityName, entityId, userId, transaction) {
    const where = {
      entity_name: entityName,
      entity_id: entityId,
      user_id: userId,
    };

    const data = {
      status: statusDictionary.getStatusDeclined(),
    };

    return model.update(data, { where, transaction });
  }

  static async isTeamMember(entityName, entityId, userId) {
    const status = usersTeamDictionary.getStatusConfirmed();

    const where = {
      status,
      entity_id: entityId,
      entity_name: entityName,
      user_id: userId,
    };

    const res = await model.count({
      where,
    });

    return !!res;
  }

  static async findAllRelatedToEntity(entityName, entityId) {
    const where = {
      entity_name: entityName,
      entity_id: entityId,
    };

    return usersModelProvider.getUsersTeamModel().findAll({
      where,
      raw: true,
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

export = UsersTeamRepository;
