const RequestHelper   = require('../../integration/helpers').Req;
const ResponseHelper  = require('../../integration/helpers').Res;

const ContentTypeDictionary   = require('uos-app-transaction').ContentTypeDictionary;

const faker = require('faker');

const EntityNotificationsRepository = require('../../../lib/entities/repository').Notifications;

const request = require('supertest');
const server = require('../../../app');

class EntityNotificationsGenerator {

  /**
   *
   * @param {number} recipientId
   * @param {number} orgIdToBoard
   * @return {Promise<Object>}
   */
  static async createPendingPrompt(recipientId, orgIdToBoard) {
    return await EntityNotificationsRepository.createUsersTeamInvitationPrompt(recipientId, orgIdToBoard);
  }
}

module.exports = EntityNotificationsGenerator;