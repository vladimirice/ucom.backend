const _ = require('lodash');
const UsersTeamRepository = require('./repository').UsersTeam;
const USERS_TEAM_PROPERTY = 'users_team';
const UpdateManyToManyHelper = require('../api/helpers/UpdateManyToManyHelper');
const models = require('../../models');

const EntityNotificationRepository = require('../entities/repository').Notifications;

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

        // TODO should be made by EventEmitter
        promises.push(this._createNotificationPromise(+user.id, entityId, transaction));
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

    await this.updateRelations(entityId, entityName, deltaData, UsersTeamRepository.getModelName(), transaction);

    return deltaData;
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

      promises.push(this._createNotificationPromise(data.user_id, entityId, transaction));

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

  /**
   *
   * @param {number} recipientId
   * @param {number} orgId
   * @param {Object} transaction
   * @return {Promise<Object>}
   * @private
   */
  static _createNotificationPromise(recipientId, orgId, transaction) {
    const notificationPromise = EntityNotificationRepository.createUsersTeamInvitationPrompt(recipientId, orgId, transaction);

    return notificationPromise;
  }
}

module.exports = UsersTeamService;