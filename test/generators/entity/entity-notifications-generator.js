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
   * @param {Object} recipient
   * @param {number} orgIdToBoard
   * @return {Promise<Object>}
   */
  static async createPendingPrompt(recipient, orgIdToBoard) {
    const title = faker.lorem.sentence();
    const description = faker.lorem.sentences();

    return await EntityNotificationsRepository.createNewSamplePendingPrompt(recipient.id, orgIdToBoard, title, description);
  }
}

module.exports = EntityNotificationsGenerator;