const _ = require('lodash');
const UsersTeamRepository = require('./repository').UsersTeam;
const USERS_TEAM_PROPERTY = 'users_team';
const UpdateManyToManyHelper = require('../api/helpers/UpdateManyToManyHelper');
const models = require('../../models');

class UsersTeamService {
  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   * @param {Object} data
   * @param {number|null} idToExclude
   * @param {Object|null} transaction
   * @return {Promise<void>}
   */
  static async processNewModelWithTeam(
    entityId,
    entityName,
    data,
    idToExclude = null,
    transaction = null
  ) {
    const usersTeam = _.filter(data[USERS_TEAM_PROPERTY]);

    if (!usersTeam || _.isEmpty(usersTeam)) {
      return;
    }

    let promises = [];
    usersTeam.forEach(user => {
      if (idToExclude === null || +user.id !== idToExclude) {
        const data = {
          'entity_id':    entityId,
          'entity_name':  entityName,
          'user_id':      +user.id,
        };

        promises.push(UsersTeamRepository.createNew(data, transaction));
      }
    });

    return Promise.all(promises);
  }


  static async processUsersTeamUpdating(
    entityId,
    entityName,
    data,
    idToExclude = null,
    transaction = null
  ) {
    const usersTeam = _.filter(data[USERS_TEAM_PROPERTY]);
    if (!usersTeam || _.isEmpty(usersTeam)) {
      // NOT possible to remove all users because of this. Wil be fixed later
      return null;
    }

    const usersTeamFiltered = usersTeam.filter(data => {
      return +data.id !== idToExclude;
    });

    const sourceModels = await UsersTeamRepository.findAllRelatedToEntity(entityName, entityId);
    const deltaData = UpdateManyToManyHelper.getCreateDeleteOnlyDelta(sourceModels, usersTeamFiltered);

    return this.updateRelations(entityId, entityName, deltaData, UsersTeamRepository.getModelName(), transaction);
  }

  /**
   *
   * @param {number} entityId
   * @param {string} entityName
   * @param {Object[]} deltaData
   * @param {string} modelName
   * @param {Object} transaction
   * @return {Promise<boolean>}
   */
  static async updateRelations(entityId, entityName, deltaData, modelName, transaction) {
    const promises = [];

    deltaData.added.forEach(data => {
      data['entity_id']   = entityId;
      data['entity_name'] = entityName;
      data['user_id']     = data['id'];

      delete data['id'];

      promises.push(models[modelName].create(data, { transaction }));
    });

    deltaData.deleted.forEach(data => {
      const promise = models[modelName].destroy({
        where: {
          id: data.id
        },
        transaction,
      });

      promises.push(promise);
    });

    return Promise.all(promises);
  }
}

module.exports = UsersTeamService;