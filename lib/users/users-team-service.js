const _ = require('lodash');
const UsersTeamRepository = require('./repository').UsersTeam;
const USERS_TEAM_PROPERTY = 'users_team';

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
}

module.exports = UsersTeamService;